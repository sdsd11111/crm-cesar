import { whatsappService } from './lib/whatsapp/WhatsAppService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log('🚀 Iniciando prueba de envío...');
    const phone = '0963410409';
    const text = 'Hola Cesar, soy Antigravity. Esta es una prueba del Webhook de WhatsApp. ¡Responde a este mensaje para verificar que el CRM lo reciba!';

    const result = await whatsappService.sendMessage(phone, text, { type: 'test_agent' });

    if (result.success) {
        console.log('✅ Mensaje enviado con éxito:', result.data);
    } else {
        console.error('❌ Error al enviar mensaje:', result.error);
    }
    process.exit(result.success ? 0 : 1);
}

test();
