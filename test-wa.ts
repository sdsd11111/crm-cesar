import axios from 'axios';
import { whatsappService } from './lib/whatsapp/WhatsAppService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { db } from './lib/db';
import { interactions } from './lib/db/schema';
import { desc, eq } from 'drizzle-orm';

async function test() {
    console.log('🔍 Verificando si llegó el mensaje...');
    try {
        const lastInters = await db.select().from(interactions)
            .where(eq(interactions.type, 'whatsapp'))
            .orderBy(desc(interactions.performedAt))
            .limit(5);

        if (lastInters.length > 0) {
            console.log('✅ Mensajes recientes encontrados:');
            lastInters.forEach(i => {
                console.log(`- [${i.direction}] ${i.content} (${i.performedAt})`);
                if (i.metadata) {
                    console.log(`  Metadata: ${JSON.stringify(i.metadata).slice(0, 100)}...`);
                }
            });
        } else {
            console.log('❌ No se encontraron mensajes de WhatsApp en la base de datos.');
        }
    } catch (e: any) {
        console.warn('⚠️ No se pudo consultar la BD (posiblemente error de conexión):', e.message);
    }

    console.log('\n🚀 Iniciando prueba de envío...');
    const phone = '593963410409'; // Added country code 593 just in case, or should I leave it as is? 
    // The user said 0963410409. In Ecuador, 09 is the mobile prefix. International is +593 9...
    // WhatsApp Cloud API usually requires the full international number without +.
    const text = 'verificado envio';

    async function sendDirectLink(phone: string, text: string) {
        const accessToken = process.env.META_WA_ACCESS_TOKEN;
        const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
        console.log(`🔗 Intentando envío directo (sin DB)...`);

        if (!accessToken || !phoneNumberId) {
            console.error('❌ Faltan credenciales de Meta en .env.local');
            return { success: false, error: 'Missing credentials' };
        }

        const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
        try {
            const res = await axios.post(url, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: { body: text }
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return { success: true, data: res.data };
        } catch (e: any) {
            return { success: false, error: e.response?.data || e.message };
        }
    }

    let result;
    try {
        result = await whatsappService.sendMessage(phone, text, { type: 'test_agent' });
    } catch (e) {
        console.warn('⚠️ Error en servicio estándar (posiblemente DB), intentando fallback directo...');
        result = await sendDirectLink(phone, text);
    }

    if (result.success) {
        console.log('✅ Mensaje enviado con éxito:', result.data);
    } else {
        console.error('❌ Error al enviar mensaje:', result.error);
    }
    process.exit(result.success ? 0 : 1);
}

test();
