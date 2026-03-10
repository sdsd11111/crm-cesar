import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function fix() {
    console.log('🛠️ Adding bot_mode to discovery_leads...');
    try {
        const check = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'discovery_leads' AND column_name = 'bot_mode';
    `);

        if (check.length === 0) {
            console.log('➕ Adding bot_mode column...');
            await db.execute(sql`ALTER TABLE discovery_leads ADD COLUMN bot_mode TEXT DEFAULT 'active';`);
            console.log('✅ bot_mode column added successfully.');
        } else {
            console.log('ℹ️ bot_mode column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        process.exit(1);
    }
}

fix();
