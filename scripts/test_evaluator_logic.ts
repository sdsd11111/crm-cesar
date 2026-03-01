/**
 * TEST: Validación lógica del prompt_session_evaluator - sin DB
 * Verifica que el evaluador tome decisiones correctas con diferentes inputs.
 * Run with: npx tsx scripts/test_evaluator_logic.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';

// Replicate getModelId/getAIClient without importing full service stack
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load prompt directly from file
function loadPrompt(): string {
    const p = path.join(process.cwd(), 'lib/donna/prompts/prompt_session_evaluator.md');
    return fs.readFileSync(p, 'utf-8');
}

async function evalSessionStep(
    userInput: string,
    collectedData: object,
    sessionStatus: 'open' | 'reviewing',
    documentType: string = 'COTIZACION'
): Promise<void> {
    const promptTemplate = loadPrompt();
    const prompt = promptTemplate
        .replace('{{documentType}}', documentType)
        .replace('{{sessionStatus}}', sessionStatus)
        .replace('{{collectedData}}', JSON.stringify(collectedData, null, 2))
        .replace('{{userInput}}', userInput);

    // Use OpenAI compatible client (same as production)
    const { OpenAI } = await import('openai');
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.GEMINI_API_KEY
        ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
        : undefined;

    const client = new OpenAI({ apiKey, baseURL });
    const modelId = process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'gpt-4o-mini';

    const response = await client.chat.completions.create({
        model: modelId,
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
}

async function runEvaluatorTests() {
    console.log('🧪 TEST: Session Evaluator Logic\n');

    const richData = {
        description: 'Página web informativa de 40 páginas para fábrica de chompas artesanales, dividida por producto (niños, adultos, lana)',
        business_name: 'Fábrica Teresita Jaramillo',
        contact_name: 'Teresita Jaramillo',
        price: 1000,
        interested_product: 'Sitio Web de 40 páginas'
    };

    const emptyData = {};

    const cases = [
        {
            name: '✅ Con datos completos + "Listo, genérala"',
            input: 'Listo, genérala',
            data: richData,
            status: 'open',
            expected: 'GENERATE_NOW'
        },
        {
            name: '✅ Con datos completos + "generemos"',
            input: 'generemos',
            data: richData,
            status: 'open',
            expected: 'GENERATE_NOW'
        },
        {
            name: '✅ Con datos completos + usuario frustrado',
            input: '¿Qué pasa solo contestas eso?',
            data: richData,
            status: 'open',
            expected: 'GENERATE_NOW'
        },
        {
            name: '✅ Con datos completos + "arma la cotización"',
            input: 'Arma la cotización',
            data: richData,
            status: 'open',
            expected: 'GENERATE_NOW'
        },
        {
            name: '✅ Con datos completos + "Una cotización para eso"',
            input: 'Una cotización para eso',
            data: richData,
            status: 'open',
            expected: 'GENERATE_NOW'
        },
        {
            name: '✅ Sin datos + usuario pide generar (collector preguntará)',
            input: 'genérala',
            data: emptyData,
            status: 'open',
            expected: 'CONTINUE_COLLECTING'
        },
        {
            name: '✅ Datos parciales + más información',
            input: 'La página tiene 40 páginas y cuesta 1000 dólares',
            data: { contact_name: 'Teresita' },
            status: 'open',
            expected: 'CONTINUE_COLLECTING'
        },
        {
            name: '✅ Cancelar sesión',
            input: 'Olvídalo, no hagas nada',
            data: richData,
            status: 'open',
            expected: 'CLOSE_SESSION'
        },
    ];

    let passed = 0;
    let failed = 0;

    for (const tc of cases) {
        process.stdout.write(`  ${tc.name}... `);
        try {
            const result: any = await evalSessionStep(tc.input, tc.data, tc.status as any);
            const correct = result.decision === tc.expected;

            if (correct) {
                console.log(`✅ ${result.decision}`);
                passed++;
            } else {
                console.log(`❌ Got: ${result.decision} (expected: ${tc.expected})`);
                console.log(`     Reason: ${result.reason}`);
                failed++;
            }
        } catch (e: any) {
            console.log(`💥 ERROR: ${e.message}`);
            failed++;
        }
    }

    console.log(`\n📊 RESULTADO: ${passed}/${cases.length} tests pasados`);
    if (failed > 0) {
        console.log(`❌ ${failed} tests fallaron - revisar prompt`);
        process.exit(1);
    } else {
        console.log('🎉 Todos los tests pasaron - listo para deploy');
    }
}

runEvaluatorTests().catch(e => {
    console.error('❌ ERROR:', e.message);
    process.exit(1);
});
