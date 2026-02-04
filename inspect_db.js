const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function check() {
    try {
        console.log('--- ULTIMAS 10 INTERACCIONES WHATSAPP ---');
        const list = await sql`
            SELECT id, content, contact_id, discovery_lead_id, created_at, metadata->>'raw' as raw_data
            FROM interactions 
            WHERE type = 'whatsapp'
            ORDER BY created_at DESC 
            LIMIT 10;
        `;
        console.table(list);

        console.log('\n--- ULTIMOS 5 LOGS WHATSAPP (AUDITORIA) ---');
        const logs = await sql`
            SELECT id, content, contact_id, status, trigger, created_at
            FROM whatsapp_logs
            ORDER BY created_at DESC 
            LIMIT 5;
        `;
        console.table(logs);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
