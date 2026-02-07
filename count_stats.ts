import { db } from './lib/db';
import { donnaChatMessages } from './lib/db/schema';
import { sql } from 'drizzle-orm';

async function countStats() {
    const total = await db.execute(sql`SELECT count(*) FROM donna_chat_messages`);
    console.log("Total messages in donna_chat_messages:", total[0].count);

    const platforms = await db.execute(sql`SELECT platform, count(*) FROM donna_chat_messages GROUP BY platform`);
    console.log("\nPlatform Distribution:");
    console.table(platforms);

    const latestChats = await db.execute(sql`
        SELECT chat_id, count(*), max(message_timestamp) as latest
        FROM donna_chat_messages
        GROUP BY chat_id
        ORDER BY latest DESC
        LIMIT 20
    `);
    console.log("\nLatest 20 Chat IDs in DB:");
    console.table(latestChats);

    process.exit(0);
}

countStats().catch(err => {
    console.error(err);
    process.exit(1);
});
