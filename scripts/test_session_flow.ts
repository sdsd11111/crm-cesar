/**
 * TEST SCRIPT: Session Flow E2E Test
 * Simula la conversación completa de cotización para verificar que el flujo funciona
 * Run with: npx tsx scripts/test_session_flow.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { cortexRouter } from '../lib/donna/services/CortexRouterService';
import { sessionManagerService } from '../lib/donna/services/SessionManagerService';
import { db } from '../lib/db';
import { donnaChatMessages, conversationalSessions } from '../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const TEST_CHAT_ID = 'test_session_flow_2026';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function send(text: string, stepName: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 [${stepName}] César dice: "${text}"`);
    console.log('='.repeat(60));

    const result = await cortexRouter.processInput({
        text,
        source: 'cesar',
        platform: 'whatsapp',
        chatId: TEST_CHAT_ID,
        skipSave: false,
    });

    // Give DB time to persist
    await sleep(300);

    // Fetch the last assistant message in the DB
    const [lastMsg] = await db.select()
        .from(donnaChatMessages)
        .where(eq(donnaChatMessages.chatId, TEST_CHAT_ID))
        .orderBy(desc(donnaChatMessages.messageTimestamp))
        .limit(1);

    console.log(`📥 Donna respondió: "${lastMsg?.content?.substring(0, 200) || '(sin respuesta en DB)'}"`);

    // Show active session state
    const session = await sessionManagerService.getActiveSession(TEST_CHAT_ID);
    if (session) {
        console.log(`🧵 Sesión activa: ${session.id} | Estado: ${session.status} | Datos:`, JSON.stringify(session.collectedData, null, 2).substring(0, 300));
    } else {
        console.log(`🔌 Sin sesión activa`);
    }

    return result;
}

async function cleanup() {
    console.log('\n🧹 Limpiando mensajes y sesiones de prueba...');
    await db.delete(donnaChatMessages).where(eq(donnaChatMessages.chatId, TEST_CHAT_ID));
    await db.update(conversationalSessions)
        .set({ status: 'abandoned' })
        .where(eq(conversationalSessions.chatId, TEST_CHAT_ID));
    console.log('✅ Limpieza completa');
}

async function runTest() {
    console.log('\n🚀 INICIANDO TEST DE FLUJO DE SESIÓN COMPLETO');
    console.log('Objetivo: Verificar que Donna puede recolectar datos y generar cotización sin bucles\n');

    await cleanup(); // Start clean

    // STEP 1: Initial request with lots of context
    await send(
        'Cotizame una página web de 40 páginas informativas, cuesta 1000 dólares, es para Teresita Jaramillo que tiene una fábrica de chompas artesanales',
        'PASO 1 - Solicitud inicial'
    );
    await sleep(1000);

    // STEP 2: Add more detail
    await send(
        'La página tiene secciones por producto: chompas para niños, adultos, y lana. El precio es $1000',
        'PASO 2 - Más detalles'
    );
    await sleep(1000);

    // STEP 3: Trigger generation
    await send(
        'Listo, genérala',
        'PASO 3 - Generar cotización'
    );
    await sleep(3000); // More time for PDF generation

    // STEP 4: Check final state
    const session = await sessionManagerService.getActiveSession(TEST_CHAT_ID);
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   Sesión activa: ${session ? `Sí (${session.status})` : 'No (cerrada correctamente)'}`);

    const allMsgs = await db.select()
        .from(donnaChatMessages)
        .where(eq(donnaChatMessages.chatId, TEST_CHAT_ID))
        .orderBy(desc(donnaChatMessages.messageTimestamp));

    console.log(`   Total mensajes en DB: ${allMsgs.length}`);
    console.log(`   Últimos mensajes:`);
    allMsgs.slice(0, 5).reverse().forEach(m => {
        console.log(`     [${m.role.toUpperCase()}]: ${m.content?.substring(0, 100)}`);
    });

    await cleanup(); // Clean up after test
}

runTest().catch(e => {
    console.error('❌ ERROR EN TEST:', e);
    process.exit(1);
});
