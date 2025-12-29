import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

async function runMigration() {
    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined");
        process.exit(1);
    }
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    try {
        console.log("🚀 Running migration: migrate_investigacion.sql");
        const sql = fs.readFileSync('migrate_investigacion.sql', 'utf8');
        await db.execute(sql);
        console.log("✅ Migration SUCCESSFUL!");
    } catch (e: any) {
        console.error("❌ Migration FAILED:");
        console.error(e);
    } finally {
        await client.end();
        process.exit();
    }
}

runMigration();
