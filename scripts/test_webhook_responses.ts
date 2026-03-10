// import fetch from 'node-fetch'; // Usar fetch nativo de Node 18+

/**
 * Script de prueba para el Webhook de Donna
 * Simula envíos de Telegram para probar la lógica sin usar el celular.
 * 
 * Uso: npx tsx scripts/test_webhook_responses.ts <mensaje>
 */

const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';

async function testMessage(text: string) {
    console.log(`\n📤 Enviando mensaje simulado: "${text}"`);

    // Payload simulado de Telegram
    const payload = {
        update_id: Date.now(),
        message: {
            message_id: 123,
            from: {
                id: 12345678,
                is_bot: false,
                first_name: "César",
                username: "cesarreyes"
            },
            chat: {
                id: process.env.TELEGRAM_CHAT_ID || 12345678,
                first_name: "César",
                type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: text
        }
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('📥 Respuesta del servidor:', JSON.stringify(data, null, 2));

        if (data.result) {
            console.log('✅ Donna procesó:', data.result.intent);
            console.log('📝 Resumen:', data.result.summary);
            if (data.result.analysis) {
                console.log('🔎 Análisis:', data.result.analysis);
            }
        } else {
            console.log('⚠️ Donna ignoró o falló');
        }

    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        console.log('¿Está corriendo el servidor en localhost:3000?');
    }
}

// Mensajes de prueba por defecto
const defaultTests = [
    "Recuérdame llamar a Claudio mañana a las 10am para revisar el contrato",
    "El cliente María Pérez prefiere que le escriban por WhatsApp",
    "Crear contacto Juan López de la empresa Tech Solutions"
];

// Ejecutar
const args = process.argv.slice(2);
const messageToTest = args.join(' ');

if (messageToTest) {
    testMessage(messageToTest);
} else {
    console.log("🚀 Corriendo batería de pruebas por defecto...");
    (async () => {
        for (const msg of defaultTests) {
            await testMessage(msg);
            // Esperar un poco entre mensajes
            await new Promise(r => setTimeout(r, 2000));
        }
    })();
}
