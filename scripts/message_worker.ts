import * as dotenv from 'dotenv';
import fs from 'fs';

// Only load .env.local if it exists (for local dev)
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
    console.log('✅ Local .env.local detected and loaded');
} else {
    console.log('🌐 No .env.local found, assuming production environment variables');
}

// CRITICAL: Start health check server FIRST for Render Free Tier
import http from 'http';
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Worker Active');
});
server.listen(port, '0.0.0.0', () => {
    console.log(`🌍 Health Check Server running on port ${port}`);
});

import { db } from '../lib/db';
import { pendingMessagesQueue } from '../lib/db/schema';
import { eq, sql, and, or, desc, inArray } from 'drizzle-orm';
import { cortexRouter } from '../lib/donna/services/CortexRouterService';

const ACCUMULATION_WINDOW_MS = 25000; // 25 seconds
const POLL_INTERVAL_MS = 5000; // 5 seconds
const OFFICE_HOURS_START = 8; // 8 AM
const OFFICE_HOURS_END = 20; // 8 PM (20:00)

function isOfficeHours() {
    const now = new Date();
    // Use local time for business hours
    const hour = now.getHours();
    return hour >= OFFICE_HOURS_START && hour < OFFICE_HOURS_END;
}

async function processQueue() {
    try {
        // TEMPORARILY DISABLED - Processing all messages immediately
        // if (!isOfficeHours()) {
        //     setTimeout(processQueue, POLL_INTERVAL_MS * 12);
        //     return;
        // }

        // 1. Get unique chatIds that have pending messages
        const pendingChats = await db.select({
            chatId: pendingMessagesQueue.chatId,
            firstUpdate: sql<string>`MIN(received_at)`
        })
            .from(pendingMessagesQueue)
            .groupBy(pendingMessagesQueue.chatId);

        const now = new Date();

        // 2. Filter chats that are ready and chats that need a typing refresh
        const readyChats = [];
        const typingRefreshChats = [];

        for (const chat of pendingChats) {
            // DEBUG: See what the DB is actually returning
            const rawStr = String(chat.firstUpdate);

            // If it already has timezone info (+00, Z, etc), use as is. 
            // If not, assume it's UTC and add Z. 
            // Also handle spaces vs T (Postgres vs ISO)
            const isoStr = rawStr.includes(' ') && !rawStr.includes('T') ? rawStr.replace(' ', 'T') : rawStr;
            const firstReceived = new Date(isoStr.includes('Z') || isoStr.includes('+') ? isoStr : `${isoStr}Z`);

            const timeDiff = now.getTime() - firstReceived.getTime();

            // DIAGNOSTIC LOG (Always show for now to debug)
            console.log(`⏱️ [TIME CHECK] Chat: ${chat.chatId} | DB Raw: "${rawStr}" | Parsed: ${firstReceived.toISOString()} | Now: ${now.toISOString()} | Diff: ${Math.round(timeDiff / 1000)}s`);

            if (timeDiff >= ACCUMULATION_WINDOW_MS) {
                readyChats.push({ ...chat, firstReceived });
            } else {
                typingRefreshChats.push(chat);
            }
        }

        // 3. Process READY chats in PARALLEL
        if (readyChats.length > 0) {
            console.log(`🚀 Processing batch for ${readyChats.length} chats in parallel...`);
            await Promise.all(readyChats.map(async (chat) => {
                try {
                    // A. Fetch all message IDs for this chat
                    const messages = await db.select()
                        .from(pendingMessagesQueue)
                        .where(eq(pendingMessagesQueue.chatId, chat.chatId))
                        .orderBy(pendingMessagesQueue.receivedAt);

                    if (messages.length === 0) return;
                    const messageIds = messages.map(m => m.id);
                    const unifiedContent = messages.map(m => m.content).join('\n');
                    const platform = (messages[0]?.platform as 'telegram' | 'whatsapp') || 'whatsapp';

                    // B. Identify Contact for Persistence
                    const { contacts, contactChannels, discoveryLeads, interactions, donnaChatMessages } = await import('../lib/db/schema');
                    const [contact] = await db.select()
                        .from(contacts)
                        .innerJoin(contactChannels, eq(contacts.id, contactChannels.contactId))
                        .where(eq(contactChannels.identifier, chat.chatId))
                        .limit(1);

                    let finalContactId = contact?.contacts?.id;
                    let finalDiscoveryLeadId = null;
                    let botMode = contact?.contacts?.botMode || 'active';

                    if (!finalContactId) {
                        const [discovery] = await db.select()
                            .from(discoveryLeads)
                            .where(eq(discoveryLeads.telefonoPrincipal, chat.chatId))
                            .limit(1);
                        if (discovery) {
                            finalDiscoveryLeadId = discovery.id;
                            botMode = discovery.botMode || 'active';
                        }
                    }

                    // C. ALWAYS PERSIST (Even if bot is paused)
                    // This creates a single record for the whole batch in the CRM
                    console.log(`📡 [PERSISTENCE] Attempting to save batch for ${chat.chatId}...`);
                    try {
                        const interactionResult = await db.insert(interactions).values({
                            type: platform,
                            direction: 'inbound',
                            content: unifiedContent,
                            contactId: finalContactId || null,
                            discoveryLeadId: finalDiscoveryLeadId || null,
                            metadata: {
                                phoneNumber: chat.chatId,
                                isBatched: true,
                                batchSize: messages.length
                            },
                            performedAt: new Date()
                        }).returning();
                        console.log(`✅ Interaction saved with ID: ${interactionResult[0]?.id}`);

                        const chatMsgResult = await db.insert(donnaChatMessages).values({
                            chatId: chat.chatId,
                            role: 'user',
                            content: unifiedContent,
                            platform: platform,
                            messageTimestamp: new Date(),
                            metadata: { source: 'worker_batch' }
                        }).returning();
                        console.log(`✅ Chat message saved with ID: ${chatMsgResult[0]?.id}`);

                        console.log(`📝 [PERSISTED] Batched ${messages.length} messages for ${chat.chatId}`);
                    } catch (persistErr) {
                        console.error(`❌ Persistence Error for ${chat.chatId}:`, persistErr);
                    }

                    // D. TRIGGER AI (Conditional)
                    let shouldSkipAI = botMode !== 'active';
                    let skipReason: string = botMode;

                    // Check for Human Intervention (Handover) if bot is active
                    if (!shouldSkipAI) {
                        const [lastOutbound] = await db.select()
                            .from(interactions)
                            .where(
                                and(
                                    eq(interactions.direction, 'outbound'),
                                    or(
                                        finalContactId ? eq(interactions.contactId, finalContactId) : sql`false`,
                                        finalDiscoveryLeadId ? eq(interactions.discoveryLeadId, finalDiscoveryLeadId) : sql`false`,
                                        sql`metadata->>'phoneNumber' = ${chat.chatId}`
                                    )
                                )
                            )
                            .orderBy(desc(interactions.performedAt))
                            .limit(1);

                        if (lastOutbound) {
                            const lastOutboundTime = new Date(lastOutbound.performedAt).getTime();
                            const firstMessageTime = chat.firstReceived.getTime();

                            if (lastOutboundTime > firstMessageTime && !lastOutbound.content?.includes('Donna:')) {
                                shouldSkipAI = true;
                                skipReason = 'human_intervention';
                            }
                        }
                    }

                    if (shouldSkipAI) {
                        console.log(`🔕 skipping AI for ${chat.chatId} (Reason: ${skipReason})`);
                    } else {
                        await cortexRouter.processInput({
                            text: unifiedContent,
                            source: 'client',
                            platform,
                            contactId: finalContactId,
                            chatId: chat.chatId,
                            skipSave: true // We already saved it above
                        });
                        console.log(`✅ AI Response processed for ${chat.chatId}`);
                    }

                    // E. Clear ONLY processed IDs from the queue
                    await db.delete(pendingMessagesQueue)
                        .where(inArray(pendingMessagesQueue.id, messageIds));
                    console.log(`🗑️ Cleared ${messageIds.length} messages from queue for ${chat.chatId}`);

                } catch (e) {
                    console.error(`❌ Batch Error for ${chat.chatId}:`, e);
                }
            }));
        }

        // 4. Refresh TYPING for waiting chats
        typingRefreshChats.map(chat => {
            import('../lib/whatsapp/WhatsAppService').then(({ whatsappService }) => {
                whatsappService.sendTypingAction(chat.chatId).catch(() => { });
            });
        });

    } catch (error) {
        console.error('Worker Error:', error);
    } finally {
        // Recursive timeout to prevent stacking if a poll takes too long
        setTimeout(processQueue, POLL_INTERVAL_MS);
    }
}

console.log('👷 Message Worker started (High Concurrency Ready)...');
processQueue();
