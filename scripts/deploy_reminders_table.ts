import './load_env'; // MUST BE FIRST
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('🔨 Creating reminders table manually...');

        // Ensure extensions if needed
        // await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`); // usually enabled

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS reminders (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id uuid,
                task_id uuid,
                title text NOT NULL,
                message text NOT NULL,
                send_at timestamptz NOT NULL,
                status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
                channel text DEFAULT 'telegram' NOT NULL CHECK (channel IN ('telegram', 'whatsapp')),
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            );
        `);
        // Add FKs separately to avoid failure if tables missing
        try {
            await db.execute(sql`ALTER TABLE reminders ADD CONSTRAINT fk_events FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;`);
        } catch (e) { console.log('⚠️ Could not add event FK (ignoring)'); }

        try {
            await db.execute(sql`ALTER TABLE reminders ADD CONSTRAINT fk_tasks FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;`);
        } catch (e) { console.log('⚠️ Could not add task FK (ignoring)'); }

        console.log('✅ Table reminders created successfully.');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }
}

main();
