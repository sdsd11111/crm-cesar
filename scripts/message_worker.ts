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
import { eq, sql, and, or, desc } from 'drizzle-orm';
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
            const firstReceived = new Date(chat.firstUpdate + 'Z');
            const timeDiff = now.getTime() - firstReceived.getTime();

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

                    // B. Trigger Donna with Safety Checks
                    const { contacts, contactChannels, discoveryLeads, interactions } = await import('../lib/db/schema');
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

                    // 1. Check Bot Mode
                    if (botMode !== 'active') {
                        console.log(`🔕 Bot is ${botMode} for ${chat.chatId}. Aborting and clearing queue.`);
                        await db.delete(pendingMessagesQueue).where(sql`id IN ${messageIds}`);
                        return;
                    }

                    // 2. Check for Human Intervention (Handover)
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

                        // If a human responded AFTER the first message was received in this batch
                        // AND the response doesn't contain the Donna prefix (meaning it's manual)
                        if (lastOutboundTime > firstMessageTime && !lastOutbound.content?.includes('Donna:')) {
                            console.log(`👤 Human intervention detected for ${chat.chatId}. Donna aborts.`);
                            await db.delete(pendingMessagesQueue).where(sql`id IN ${messageIds}`);
                            return;
                        }
                    }

                    const platform = (messages[0]?.platform as 'telegram' | 'whatsapp') || 'whatsapp';

                    await cortexRouter.processInput({
                        text: unifiedContent,
                        source: 'client',
                        platform,
                        contactId: finalContactId,
                        chatId: chat.chatId
                    });

                    // C. Clear ONLY processed IDs
                    await db.delete(pendingMessagesQueue)
                        .where(sql`id IN ${messageIds}`);

                    console.log(`✅ Batch processed for ${chat.chatId}`);
                } catch (e) {
                    console.error(`❌ Parallel Error for ${chat.chatId}:`, e);
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
