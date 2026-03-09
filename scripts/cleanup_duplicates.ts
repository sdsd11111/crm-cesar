import { db } from '../lib/db';
import { donnaChatMessages } from '../lib/db/schema';
import { sql, inArray } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function cleanupDuplicates() {
    try {
        console.log('🔍 Finding duplicate messages in donna_chat_messages...');

        // This query finds messages that have another message with:
        // 1. Same chatId
        // 2. Same role
        // 3. Same content
        // 4. Within a 5-minute window
        // And marks the newer ones for deletion.
        const duplicates = await db.execute(sql`
            WITH Deletable AS (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY chat_id, role, content, platform, 
                                        date_trunc('hour', message_timestamp),
                                        (extract(minute from message_timestamp)::int / 5)
                           ORDER BY message_timestamp ASC
                       ) as rn
                FROM donna_chat_messages
            )
            SELECT id FROM Deletable WHERE rn > 1;
        `);

        const idsToDelete = duplicates.map((r: any) => r.id);

        if (idsToDelete.length === 0) {
            console.log('✅ No duplicates found.');
            return;
        }

        console.log(`🗑️ Found ${idsToDelete.length} duplicate messages. Deleting...`);

        const batchSize = 100;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize);
            await db.delete(donnaChatMessages).where(inArray(donnaChatMessages.id, batch));
            console.log(`   - Deleted ${i + batch.length}/${idsToDelete.length}`);
        }

        console.log('✅ Cleanup complete.');
    } catch (e) {
        console.error('❌ Cleanup failed:', e);
    } finally {
        process.exit(0);
    }
}

cleanupDuplicates();
