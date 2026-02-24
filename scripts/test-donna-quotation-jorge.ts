import { config } from 'dotenv';
config({ path: '.env.local' });
import { cortexRouter } from '../lib/donna/services/CortexRouterService';
import { db } from '../lib/db';
import { contacts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function testJorgeQuotation() {
    console.log('🚀 [Test] Simulando petición de cotización para Jorge Hurtado...');

    // Simulamos un input que vendría de César hablando con Donna
    const mockInput: any = {
        text: 'Preparame una cotización para un salón de eventos llamado Loxa, quieren una página de go de 250 y un contacto digital si nos reunimos el dueño se llama Jorge Hurtado y que hagas la cotización solo por los dos items, la página es la go de $250 y el contacto digital el de $20 dólares',
        source: 'cesar',
        platform: 'whatsapp',
        chatId: 'test_jorge_horst',
        skipSave: true // Evitamos guardar en DB para no ensuciar el historial real
    };

    try {
        console.log('--- Iniciando Procesamiento ---');
        await cortexRouter.processInput(mockInput);
        console.log('--- Procesamiento Finalizado ---');
    } catch (error) {
        console.error('❌ Error en el test:', error);
    }
}

testJorgeQuotation().catch(console.error);
