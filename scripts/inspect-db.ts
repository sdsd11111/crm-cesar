
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function inspectTable() {
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contacts'
        `);
        console.log("--- Columns in 'contacts' table ---");
        console.table(result);
    } catch (e) {
        console.error("Failed to inspect table:", e);
    }
}

inspectTable();
