import { db } from './lib/db';
import { donnaChatMessages } from './lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';

async function migrate() {
    console.log("Migrating telegram messages with phone IDs to whatsapp...");

    // Update messages that have a chatId looking like a phone number (start with 593 or 10+ digits)
    const result = await db.execute(sql`
        UPDATE donna_chat_messages 
        SET platform = 'whatsapp' 
        WHERE platform = 'telegram' 
        AND (chat_id ~ '^[0-9]{10,}$' OR chat_id LIKE '593%')
    `);

    console.log("Migration completed.");
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
