import { db } from './lib/db';
import { donnaChatMessages } from './lib/db/schema';
import { desc } from 'drizzle-orm';

async function debug() {
    console.log("Fetching last 50 messages from donnaChatMessages...");
    const messages = await db.select()
        .from(donnaChatMessages)
        .orderBy(desc(donnaChatMessages.messageTimestamp))
        .limit(50);

    console.table(messages.map(m => ({
        id: m.id,
        chatId: m.chatId,
        platform: m.platform,
        role: m.role,
        timestamp: m.messageTimestamp,
        content: m.content.substring(0, 30)
    })));
    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});
