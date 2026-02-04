import * as dotenv from 'dotenv';
import * as path from 'path';
import { cortexRouter } from '../lib/donna/services/CortexRouterService';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testScenario(name: string, input: string) {
    console.log(`\n🧪 PRUEBA ESCENARIO: ${name}`);
    console.log(`👤 Usuario dice: "${input}"`);

    try {
        const result = await cortexRouter.processInput({
            text: input,
            source: 'client',
            chatId: `wa-test-${Date.now()}`, // Unique ID to avoid history mixing
            promptOverride: undefined // Force using the default campaign prompt logic
        });

        if (result && result.response) {
            console.log(`🤖 Donna responde:\n${result.response}`);
        } else {
            console.log(`⚠️ Respuesta inesperada:`, JSON.stringify(result, null, 2));
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

async function runTests() {
    console.log("🚀 INICIANDO PRUEBAS DE LÓGICA CARNAVAL 2026 (Modelo: GPT-4o-mini)");

    // 1. Escenario Saludo
    await testScenario("SALUDO SIMPLE", "Hola");

    // 2. Escenario Pregunta de Venta
    await testScenario("INTERÉS EN COMPRA", "¿Qué precio tiene el plan?");

    // 3. Escenario Auto-Descubrimiento
    await testScenario("AUTO-DESCUBRIMIENTO", "Hola, soy Juan Pérez de Quito y tengo un restaurante.");

    // 4. Escenario Insulto/Ruido
    await testScenario("INSULTO/RUIDO", "Eres una tonta y fea");

    console.log("\n🏁 Pruebas finalizadas.");
    process.exit();
}

runTests();
