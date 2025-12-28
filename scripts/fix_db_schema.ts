import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ No DATABASE_URL found in .env.local');
    process.exit(1);
}

async function runMigration() {
    console.log('🚀 Running manual database fix...');
    const client = postgres(connectionString!);

    try {
        console.log('Adding birthday column...');
        await client`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday TIMESTAMP WITH TIME ZONE;`;

        console.log('Adding anniversary_date column...');
        await client`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS anniversary_date TIMESTAMP WITH TIME ZONE;`;

        console.log('Adding category_tags column...');
        await client`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category_tags TEXT[] DEFAULT '{}';`;

        console.log('Adding whatsapp_opt_out column...');
        await client`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;`;

        console.log('✅ Base de Datos actualizada Correctamente.');
    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await client.end();
    }
}

runMigration();
