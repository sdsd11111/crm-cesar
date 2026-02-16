
import * as dotenv from 'dotenv';
import * as path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

import { db } from '../lib/db';
import { donnaChatMessages, products } from '../lib/db/schema';
import { desc, sql, or } from 'drizzle-orm';

async function audit() {
    console.log('--- 🔎 AUDIT START ---');

    try {
        // 1. Check Messages
        console.log('\n💬 LAST 20 MESSAGES:');
        const messages = await db.select()
            .from(donnaChatMessages)
            .orderBy(desc(donnaChatMessages.messageTimestamp))
            .limit(20);

        messages.forEach((m, i) => {
            console.log(`[${i}] ${m.role} (${m.chatId}): ${m.content.substring(0, 50)}...`);
        });

        // 2. Check Products for Carnaval
        console.log('\n🛒 SEARCHING PRODUCTS FOR "CARNAVAL":');
        const carnavalProducts = await db.select()
            .from(products)
            .where(or(
                sql`\"Nombre del Producto o Servicio\" ILIKE '%carnaval%'`,
                sql`\"Descripción\" ILIKE '%carnaval%'`,
                sql`\"Beneficios\" ILIKE '%carnaval%'`,
                sql`\"Etiqueta\" ILIKE '%carnaval%'`,
                sql`\"Servicios Incluidos (Ejemplo base)\" ILIKE '%carnaval%'`
            ));

        console.log(`Found ${carnavalProducts.length} products.`);
        carnavalProducts.forEach(p => console.log(`- ${p.name}`));

    } catch (e) {
        console.error('❌ Audit Error:', e);
    } finally {
        process.exit(0);
    }
}

audit();
