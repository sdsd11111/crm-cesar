
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('🚀 Starting Migration 012: Contact Channels...');
    try {
        const migrationPath = path.join(process.cwd(), 'migrations', '012_create_contact_channels.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        // Split by statement if possible, or run as one block depending on driver
        // For Drizzle raw SQL execution:
        await db.execute(sql.raw(migrationSql));

        console.log('✅ Migration 012 completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } // Ensure process exit is handled by the caller or runtime if needed
}

runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
