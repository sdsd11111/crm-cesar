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

        for (const chat of pendingChats) {
            const firstReceived = new Date(chat.firstUpdate);
            const timeDiff = now.getTime() - firstReceived.getTime();

            if (timeDiff >= ACCUMULATION_WINDOW_MS) {
                console.log(`🚀 Processing batch for ${chat.chatId} (Accumulated for ${timeDiff}ms)`);

                // A. Fetch all message IDs for this chat to avoid race conditions
                const messages = await db.select()
                    .from(pendingMessagesQueue)
                    .where(eq(pendingMessagesQueue.chatId, chat.chatId))
                    .orderBy(pendingMessagesQueue.receivedAt);

                if (messages.length === 0) continue;
                const messageIds = messages.map(m => m.id);

                // B. Construct unified content
                const unifiedContent = messages.map(m => m.content).join('\n');

                // C. Trigger Donna
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
                }).catch(e => console.error(`Cortex error for ${chat.chatId}:`, e));

                // D. CLEAR QUEUE (ONLY processed IDs)
                await db.delete(pendingMessagesQueue)
                    .where(sql`id IN ${messageIds}`);

                console.log(`✅ Batch processed and queue cleared for ${chat.chatId} (${messageIds.length} msgs)`);
            } else {
                // E. REFRESH TYPING INDICATOR while waiting
                // Dynamically import to avoid circular dependencies if any
                import('../lib/whatsapp/WhatsAppService').then(({ whatsappService }) => {
                    whatsappService.sendTypingAction(chat.chatId).catch(() => { });
                });
                console.log(`⏳ Waiting for ${chat.chatId} (${ACCUMULATION_WINDOW_MS - timeDiff}ms left)`);
            }
        }
    } catch (error) {
        console.error('Worker Error:', error);
    }
}

console.log('👷 Message Worker started...');
setInterval(processQueue, POLL_INTERVAL_MS);
