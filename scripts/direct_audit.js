
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
    console.log('--- 🔎 DIRECT DB AUDIT ---');
    try {
        // 1. Messages
        console.log('\n💬 ÚLTIMOS MENSAJES:');
        const messages = await sql`
            SELECT role, content, chat_id, message_timestamp 
            FROM donna_chat_messages 
            ORDER BY message_timestamp DESC 
            LIMIT 10
        `;
        messages.forEach((m, i) => {
            console.log(`[${i}] ${m.role} (${m.chat_id}): ${m.content.substring(0, 100)}`);
        });

        // 2. Products with Carnaval
        console.log('\n🛒 PRODUCTOS CON "CARNAVAL":');
        const products = await sql`
            SELECT "Nombre del Producto o Servicio" as name, "Descripción" as desc, "Beneficios" as benefits
            FROM products
            WHERE "Nombre del Producto o Servicio" ILIKE '%carnaval%'
               OR "Descripción" ILIKE '%carnaval%'
               OR "Beneficios" ILIKE '%carnaval%'
               OR "Etiqueta" ILIKE '%carnaval%'
        `;
        products.forEach(p => console.log(`- ${p.name} | ${p.desc} | ${p.benefits}`));

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

run();
