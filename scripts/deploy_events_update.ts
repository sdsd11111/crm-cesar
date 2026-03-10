
import './load_env';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('🔨 Adding status column to events table manually...');

        await db.execute(sql`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed'));
        `);

        console.log('✅ Column status added to events successfully.');
    } catch (error) {
        console.error('❌ Error updating table:', error);
    }
}

main();
