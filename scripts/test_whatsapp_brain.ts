import * as dotenv from 'dotenv';
import * as path from 'path';
import { cortexRouter } from '../lib/donna/services/CortexRouterService';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testWhatsappLogic() {
    const testMessage = "Hola, vi lo del Plan Carnaval 2026. ¿Me puedes dar el precio y decirme qué incluye la oferta de los $250?";
    const testPhone = "593963410409";

    console.log(`🧪 Simulando mensaje de WhatsApp de ${testPhone}: "${testMessage}"`);

    try {
        const result = await cortexRouter.processInput({
            text: testMessage,
            source: 'client',
            chatId: `wa-${testPhone}`,
            phone: testPhone,
            metadata: {
                platform: 'whatsapp',
                campaign: 'carnaval_2026'
            }
        });

        console.log('\n✅ RESULTADO DEL CEREBRO:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error: any) {
        console.error('❌ Error en la simulación:', error.message);
    }
}

testWhatsappLogic();
