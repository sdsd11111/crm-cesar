
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function sendDirect() {
    const phone = '593963410409';
    const text = 'verificado envio';
    const accessToken = process.env.META_WA_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

    console.log('🚀 Iniciando envío directo de WhatsApp...');
    console.log(`📱 Destinatario: ${phone}`);

    if (!accessToken || !phoneNumberId) {
        console.error('❌ Falta configuración en .env.local');
        process.exit(1);
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
        console.log('✅ Mensaje enviado!', res.data);
    } catch (e: any) {
        console.error('❌ Error al enviar:', e.response?.data || e.message);
    }
}

sendDirect();
