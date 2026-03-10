import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function checkColumns() {
    console.log('🔍 Checking columns in "contacts" and "discovery_leads" tables...');

    try {
        const contactColumns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position;
        `);
        console.log('\n--- CONTACTS COLUMNS ---');
        console.table(contactColumns.rows);

        const discoveryColumns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'discovery_leads'
            ORDER BY ordinal_position;
        `);
        console.log('\n--- DISCOVERY_LEADS COLUMNS ---');
        console.table(discoveryColumns.rows);

    } catch (error) {
        console.error('❌ Error checking columns:', error);
    }
}

checkColumns();
