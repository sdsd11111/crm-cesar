import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar explícitamente .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    const args = process.argv.slice(2);
    const phone = args[0];

    if (!phone) {
        console.error('Usage: npx tsx scripts/test_whatsapp.ts <phone_number>');
        process.exit(1);
    }

    const accessToken = process.env.META_WA_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    const version = 'v22.0';

    console.log(`📨 Testing Meta WhatsApp delivery to ${phone}...`);
    console.log(`🔑 Token length: ${accessToken?.length || 0}`);
    console.log(`📞 Phone ID: ${phoneNumberId || 'NOT SET'}`);

    if (!accessToken || !phoneNumberId) {
        console.error('❌ Missing credentials in .env.local');
        process.exit(1);
    }

    // Limpiar número de teléfono (formato Ecuador)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
        cleanPhone = '593' + cleanPhone.slice(1);
    } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('593')) {
        cleanPhone = '593' + cleanPhone;
    }

    console.log(`📱 Sending to: ${cleanPhone}`);

    try {
        const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanPhone,
                type: "text",
                text: {
                    body: "🤖 Hola! Esta es una prueba de conexión desde el CRM Objetivo (Meta API). ✅"
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Meta API Error:', response.status);
            console.error('Details:', JSON.stringify(data, null, 2));
            process.exit(1);
        }

        console.log('✅ Message SENT successfully!');
        console.log('Message ID:', data.messages?.[0]?.id);
        console.log('Full Response:', JSON.stringify(data, null, 2));

    } catch (e: any) {
        console.error('❌ Critical Error:', e.message);
        process.exit(1);
    }
}

main();
