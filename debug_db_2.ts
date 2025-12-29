import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined in .env.local");
        process.exit(1);
    }

    console.log("🔗 Connecting to:", connectionString.replace(/:.*@/, ':****@'));
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    try {
        const result = await db.execute('SELECT 1 as test');
        console.log("✅ Connection Test SUCCESS:", result);

        // Check columns of discovery_leads
        const columns = await db.execute(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'discovery_leads'
        `);
        console.log("📊 discovery_leads columns:");
        console.table(columns.map((c: any) => c.column_name));

    } catch (e: any) {
        console.error("❌ Connection Test FAILED:");
        console.error(e);
    } finally {
        await client.end();
        process.exit();
    }
}

testConnection();
