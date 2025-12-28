
import './load_env';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('🔨 Creating conversation_states table manually...');

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS conversation_states (
                key text PRIMARY KEY,
                data jsonb DEFAULT '{}',
                updated_at timestamp DEFAULT now() NOT NULL
            );
        `);

        console.log('✅ Table conversation_states created successfully.');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }
}

main();
