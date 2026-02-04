import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db';
import { pendingMessagesQueue } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cortexRouter } from '../lib/donna/services/CortexRouterService';

const ACCUMULATION_WINDOW_MS = 25000; // 25 seconds
const POLL_INTERVAL_MS = 5000; // 5 seconds

async function processQueue() {
    try {
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
                readyChats.push(chat);
            } else {
                typingRefreshChats.push(chat);
            }
        }

        // 3. Process READY chats in PARALLEL
        // This ensures that 100 people don't wait for each other's AI to finish
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

                    // B. Trigger Donna
                    const { contacts, contactChannels } = await import('../lib/db/schema');
                    const [contact] = await db.select()
                        .from(contacts)
                        .innerJoin(contactChannels, eq(contacts.id, contactChannels.contactId))
                        .where(eq(contactChannels.identifier, chat.chatId))
                        .limit(1);

                    await cortexRouter.processInput({
                        text: unifiedContent,
                        source: 'client',
                        contactId: contact?.contacts?.id,
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
