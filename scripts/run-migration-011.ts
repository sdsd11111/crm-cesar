
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('🚀 Starting Omni-channel Migration...');

    const migrationPath = path.join(process.cwd(), 'migrations', '011_omnichannel_fields.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    try {
        await db.execute(sql.raw(migrationSql));
        console.log('✅ Migration executed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }

    process.exit(0);
}

main();
