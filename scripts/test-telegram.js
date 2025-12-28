// Script para enviar mensaje de prueba a Telegram
const botToken = '7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk';
const chatId = '2126922376';

const message = `🤖 **Donna está lista!**

✅ Entity Resolver implementado
✅ Cortex Router funcional  
✅ Roadmap de superpoderes creado

Próxima prueba: Envíame un mensaje mencionando el nombre de un cliente (ej: "Claudio me pidió una cotización") y veré si puedo encontrarlo en la base de datos.`;

fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Mensaje enviado:', data);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
