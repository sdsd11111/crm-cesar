import { db } from '../lib/db';
import { donnaChatMessages, interactions, whatsappLogs } from '../lib/db/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkDuplicates() {
    try {
        const chatMsgs = await db.select({ count: sql<number>`count(*)` }).from(donnaChatMessages);
        console.log(`donna_chat_messages total rows: ${chatMsgs[0].count}`);

        const inters = await db.select({ count: sql<number>`count(*)` }).from(interactions);
        console.log(`interactions total rows: ${inters[0].count}`);

        const wLogs = await db.select({ count: sql<number>`count(*)` }).from(whatsappLogs);
        console.log(`whatsapp_logs total rows: ${wLogs[0].count}`);

        // Check for duplicates in donnaChatMessages
        const duplicates = await db.execute(sql`
            SELECT content, COUNT(*) as count
            FROM donna_chat_messages
            GROUP BY content
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 5
        `);
        console.log('\nTop 5 duplicate messages in donna_chat_messages:');
        console.log(duplicates);

    } catch (e) {
        console.error(e);
    }
}

checkDuplicates();
