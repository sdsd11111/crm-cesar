// @ts-nocheck
import { db } from './lib/db';
import { pendingMessagesQueue } from './lib/db/schema';
import { sql } from 'drizzle-orm';

async function testSchema() {
    try {
        console.log('🔍 Checking if "metadata" column exists in "pending_messages_queue"...');
        const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'pending_messages_queue' AND column_name = 'metadata';
        `);

        if (result.length > 0) {
            console.log('✅ Column "metadata" exists!');
        } else {
            console.log('❌ Column "metadata" DOES NOT exist.');
            console.log('Attempting to add it manually...');
            await db.execute(sql`ALTER TABLE pending_messages_queue ADD COLUMN metadata JSONB DEFAULT '{}';`);
            console.log('✅ Column "metadata" added successfully.');
        }
    } catch (error) {
        console.error('❌ Error testing/updating schema:', error);
    } finally {
        process.exit(0);
    }
}

testSchema();
