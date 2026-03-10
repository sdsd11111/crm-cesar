
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('🚀 Starting Migration 013: Enable RLS on Channels...');
    try {
        const migrationPath = path.join(process.cwd(), 'migrations', '013_enable_rls_channels.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        // Split by statement if needed, or simple execute
        await db.execute(sql.raw(migrationSql));

        console.log('✅ Security Policies Applied.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
