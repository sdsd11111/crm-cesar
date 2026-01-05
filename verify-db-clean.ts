import { db } from './lib/db';
import { interactions } from './lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('🔍 Verificando interacciones de WhatsApp en la BD...');
    try {
        const lastInters = await db.select().from(interactions)
            .where(eq(interactions.type, 'whatsapp'))
            .orderBy(desc(interactions.performedAt))
            .limit(10);

        if (lastInters.length > 0) {
            console.log(`✅ Se encontraron ${lastInters.length} mensajes.`);
            lastInters.forEach((i, idx) => {
                console.log(`\n--- Mensaje ${idx + 1} ---`);
                console.log(`ID: ${i.id}`);
                console.log(`Dirección: ${i.direction}`);
                console.log(`Contenido: ${i.content}`);
                console.log(`Fecha: ${i.performedAt}`);
                console.log(`Metadata: ${JSON.stringify(i.metadata, null, 2)}`);
            });
        } else {
            console.log('❌ No hay mensajes de WhatsApp.');
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}

verify();
