import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined");
        process.exit(1);
    }
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    try {
        console.log("📊 discovery_leads columns:");
        const res1 = await db.execute(`SELECT column_name FROM information_schema.columns WHERE table_name = 'discovery_leads'`);
        console.table(res1.map((c: any) => c.column_name));

        console.log("📊 contacts columns:");
        const res2 = await db.execute(`SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'`);
        console.table(res2.map((c: any) => c.column_name));

    } catch (e: any) {
        console.error("❌ Error:");
        console.error(e);
    } finally {
        await client.end();
        process.exit();
    }
}

testConnection();
