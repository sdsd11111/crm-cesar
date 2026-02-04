import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🚀 Starting Database Migration: Fix donna_chat_messages.platform');

    try {
        console.log('1. Removing existing constraints on donna_chat_messages...');
        // We convert the column to plain text to remove any PG Enum or Check constraints
        await db.execute(sql`ALTER TABLE "donna_chat_messages" ALTER COLUMN "platform" TYPE text`);
        await db.execute(sql`ALTER TABLE "donna_chat_messages" ALTER COLUMN "platform" SET DEFAULT 'telegram'`);

        console.log('✅ Migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit();
    }
}

migrate();
