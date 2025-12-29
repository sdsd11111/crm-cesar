import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function debugDB() {
    console.log("🔍 Checking DB connection...");
    try {
        const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'discovery_leads'
        `);
        console.log("✅ Connection successful!");
        console.log("Columns in discovery_leads:");
        console.table(result);

        const hasInvestigacion = result.some((r: any) => r.column_name === 'investigacion');
        if (hasInvestigacion) {
            console.log("ℹ️ Column 'investigacion' EXISTS.");
        } else {
            console.error("❌ Column 'investigacion' MISSING!");
        }
    } catch (error: any) {
        console.error("💥 CRITICAL DB ERROR:");
        console.error(error.message);
        if (error.code) console.error("Error Code:", error.code);
    } finally {
        process.exit();
    }
}

debugDB();
