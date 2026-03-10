
import './load_env';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('🛡️ Enabling RLS and Security Policies...');

        // 1. Reminders
        await db.execute(sql`ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;`);
        await db.execute(sql`DROP POLICY IF EXISTS "Enable all access for authenticated users" ON reminders;`);
        await db.execute(sql`
            CREATE POLICY "Enable all access for authenticated users" ON reminders
            FOR ALL
            USING (true)
            WITH CHECK (true);
        `);
        console.log('✅ RLS enabled for reminders');

        // 2. Conversation States
        await db.execute(sql`ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;`);
        await db.execute(sql`DROP POLICY IF EXISTS "Enable all access for authenticated users" ON conversation_states;`);
        await db.execute(sql`
            CREATE POLICY "Enable all access for authenticated users" ON conversation_states
            FOR ALL
            USING (true)
            WITH CHECK (true);
        `);
        console.log('✅ RLS enabled for conversation_states');

        // Optional: Check events just in case
        // await db.execute(sql`ALTER TABLE events ENABLE ROW LEVEL SECURITY;`);
        // ... (Usually handled by main schema migration if strictly managed, but good to ensure)

    } catch (error) {
        console.error('❌ Error applying security policies:', error);
    }
}

main();
