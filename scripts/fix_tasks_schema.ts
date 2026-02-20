import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Applying schema fix for tasks table...');
    try {
        await db.execute(sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_at timestamp;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
    `);
        console.log('Successfully added reminder_at and reminder_sent to tasks table.');
    } catch (err) {
        console.error('Error applying schema fix:', err);
    }
    process.exit(0);
}

main();
