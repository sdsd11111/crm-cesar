
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    console.log('--- 🚀 BROAD CARNAVAL PURGE SCAN ---');
    try {
        const tables = [
            { name: 'loyalty_missions', col: 'content' },
            { name: 'discovery_leads', col: 'nombre_comercial' },
            { name: 'discovery_leads', col: 'actividad_modalidad' },
            { name: 'discovery_leads', col: 'clasificacion' },
            { name: 'discovery_leads', col: 'categoria' },
            { name: 'leads', col: 'interested_product' },
            { name: 'contacts', col: 'interested_product' },
            { name: 'system_settings', col: 'value::text' },
            { name: 'products', col: 'benefits' },
            { name: 'products', col: 'tags' },
            { name: 'products', col: 'servicesIncluded' }
        ];

        for (const t of tables) {
            console.log(`Checking ${t.name}.${t.col}...`);
            const results = await sql`
                SELECT id FROM ${sql(t.name)} 
                WHERE ${sql.unsafe(t.col)} ILIKE '%carnaval%'
            `;
            if (results.length > 0) {
                console.log(`⚠️ FOUND ${results.length} matches in ${t.name}!`);
                const deleted = await sql`
                    DELETE FROM ${sql(t.name)} 
                    WHERE ${sql.unsafe(t.col)} ILIKE '%carnaval%'
                    RETURNING id
                `;
                console.log(`✅ Deleted ${deleted.length} entries.`);
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

run();
