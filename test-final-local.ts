import { whatsappService } from './lib/whatsapp/WhatsAppService';
import * as dotenv from 'dotenv';
import path from 'path';

// FORCE Environment injection before service init
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Manually set env vars in case they weren't picked up by the class constructor (since imports run first)
process.env.META_WA_ACCESS_TOKEN = process.env.META_WA_ACCESS_TOKEN || '';
process.env.META_WA_PHONE_NUMBER_ID = process.env.META_WA_PHONE_NUMBER_ID || '';
process.env.META_WA_VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN || '';

async function test() {
    console.log('🚀 Iniciando verificación LOCAL definitiva...');

    // Create new instance to ensure it picks up the forced ENV
    const { WhatsAppService } = await import('./lib/whatsapp/WhatsAppService');
    const service = new WhatsAppService();

    const phone = '0963410409';
    const text = '🦁 TEST LOCAL: Hola Cesar, soy tu CRM. Si lees esto, tu computadora ya está configurada para enviar WhatsApps reales.';

    const result = await service.sendMessage(phone, text, { type: 'final_local_check' });

    if (result.success) {
        console.log('✅ EXITO: Mensaje enviado desde tu local.');
    } else {
        console.error('❌ ERROR: Revisa tus credenciales en .env.local');
        console.error('Detalle:', result.error);
    }
    process.exit(result.success ? 0 : 1);
}

test();
