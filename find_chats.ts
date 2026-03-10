import { db } from './lib/db';
import { donnaChatMessages } from './lib/db/schema';
import { sql } from 'drizzle-orm';

async function findMessages() {
    const numbers = ['084', '6084', '2875'];
    console.log("Searching for messages with chatId ending in:", numbers);

    for (const num of numbers) {
        const results = await db.select()
            .from(donnaChatMessages)
            .where(sql`${donnaChatMessages.chatId} LIKE ${'%' + num}`)
            .limit(5);

        console.log(`\nResults for %${num}:`);
        console.table(results.map(r => ({
            id: r.id,
            chatId: r.chatId,
            platform: r.platform,
            messageTimestamp: r.messageTimestamp,
            content: r.content.substring(0, 50)
        })));
    }
    process.exit(0);
}

findMessages().catch(err => {
    console.error(err);
    process.exit(1);
});
