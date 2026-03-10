import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runDiagnostic() {
    console.log('==========================================');
    console.log('   DIAGNOSTICO DE APIS (TRAINER)');
    console.log('==========================================\n');

    // 1. Test Gemini
    console.log('[1/2] Probando Google Gemini (Estrategia)...');
    const gKey = process.env.GOOGLE_API_KEY;
    if (!gKey) {
        console.error('❌ ERROR: GOOGLE_API_KEY no encontrada en .env.local');
    } else {
        const genAI = new GoogleGenerativeAI(gKey);
        // Using common model name
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        try {
            const r = await model.generateContent('Dime hola en una palabra');
            console.log('✅ GEMINI (gemini-1.5-flash) OK: ' + r.response.text().trim());
        } catch (e: any) {
            console.error('❌ GEMINI ERROR: ' + e.message);
            console.log('Intentando con modelo alternativo (gemini-pro)...');
            try {
                const altModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
                const r2 = await altModel.generateContent('Dime hola');
                console.log('✅ GEMINI (gemini-pro) OK: ' + r2.response.text().trim());
            } catch (e2: any) {
                console.error('❌ GEMINI PRO ERROR: ' + e2.message);
            }
        }
    }

    console.log('');

    // 2. Test OpenAI
    console.log('[2/2] Probando OpenAI (Analisis/Perfil)...');
    const oKey = process.env.OPENAI_API_KEY;
    if (!oKey) {
        console.error('❌ ERROR: OPENAI_API_KEY no encontrada en .env.local');
    } else {
        const openai = new OpenAI({ apiKey: oKey });
        try {
            const r = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Di hola en una palabra' }]
            });
            console.log('✅ OPENAI OK: ' + r.choices[0].message.content?.trim());
        } catch (e: any) {
            console.error('❌ OPENAI ERROR: ' + e.message);
            if (e.message.includes('insufficient_quota') || e.message.includes('429')) {
                console.log('   -> Sugerencia: Te has quedado sin saldo en OpenAI.');
            }
        }
    }

    console.log('\n==========================================');
    console.log('Diagnostico terminado.');
    console.log('==========================================');
}

runDiagnostic();
