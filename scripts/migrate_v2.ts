import dotenv from 'dotenv';
import path from 'path';

// Force load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🚀 Finalizing Donna v2.0 Database Migration (with Env Fixed)...');
    try {
        await db.execute(sql`
      ALTER TABLE donna_chat_messages 
      ADD COLUMN IF NOT EXISTS message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
        console.log('✅ Column message_timestamp added (or already existed).');

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_message_timestamp ON donna_chat_messages(message_timestamp);
    `);
        console.log('✅ Index idx_message_timestamp created.');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
