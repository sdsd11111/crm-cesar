import { db } from './lib/db';
import { pendingMessagesQueue } from './lib/db/schema';
import { classifierService } from './lib/donna/services/ClassifierService';
import { transcriptionService } from './lib/ai/TranscriptionService';
import { cortexRouter } from './lib/donna/services/CortexRouterService';

async function verifyFlow() {
    console.log('🧪 Starting Multi-Agent Flow Verification...');

    // 1. Test Classification
    console.log('\n--- 1. Testing Classification ---');
    const tests = [
        { text: 'Agéndame una cita para mañana a las 10am', expected: 'crear' },
        { text: '¿Qué tengo que hacer hoy?', expected: 'agenda' },
        { text: 'Cancela la reunión con Juan', expected: 'borrar' },
        { text: 'Hola Donna, ¿cómo estás?', expected: 'desconocido' }
    ];

    for (const test of tests) {
        const result = await classifierService.classify(test.text);
        console.log(`Input: "${test.text}" | Result: ${result} | ${result === test.expected ? '✅' : '❌'}`);
    }

    // 2. Test Transcription (Mocked)
    console.log('\n--- 2. Testing Transcription Logic (Unit) ---');
    // We can't easily test the full worker loop without real audio IDs, 
    // but we can test the router's reaction to transcription markers.

    const transcribedText = '[Audio Transcrito]: Necesito agendar una reunión para el lunes.';
    const resultClassification = await classifierService.classify(transcribedText);
    console.log(`Transcription Input: "${transcribedText}" | Result: ${resultClassification}`);

    // 3. Test Expert Routing (Logic Only)
    console.log('\n--- 3. Testing Router Dispatch ---');
    // We simulate a call to processInput and check logs externally (manual observation of stdout)
    // In a real test we might spy on fs.readFileSync

    console.log('Checking router logic for "crear" intent...');
    await cortexRouter.processInput({
        text: 'Agéndame algo para mañana',
        source: 'cesar',
        chatId: 'test_chat_id',
        skipSave: true
    });

    console.log('Checking router logic for "agenda" intent...');
    await cortexRouter.processInput({
        text: '¿Qué tengo hoy?',
        source: 'cesar',
        chatId: 'test_chat_id',
        skipSave: true
    });

    console.log('\n✅ Verification Script Completed.');
    process.exit(0);
}

verifyFlow();
