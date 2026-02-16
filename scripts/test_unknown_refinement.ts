
import * as dotenv from 'dotenv';
import * as path from 'path';
import fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ .env.local loaded');
}

async function runRefinedAudit() {
    const { alejandraService } = await import('../lib/donna/services/AlejandraService');

    console.log('🧪 INICIANDO AUDITORÍA DE REFINAMIENTO: DESCONOCIDOS Y PRIMER CONTACTO');

    const testCases = [
        {
            name: "CASO 1: CONTACTO NUEVO (Presentación)",
            chatId: "593888777000",
            text: "Hola, ¿qué hacen ustedes?",
            context: { contactName: "Desconocido", source: "client" }
        },
        {
            name: "CASO 2: VAGO (Video sin especificar)",
            chatId: "593111222333",
            text: "Acabo de ver un video suyo y me encantó, ¿cuánto cuesta eso?",
            context: { contactName: "Carlos Pérez", source: "client" }
        },
        {
            name: "CASO 3: OUT-OF-SCOPE (Sándwiches de pollo)",
            chatId: "593444555666",
            text: "¿Me pueden enviar 10 sándwiches de pollo a la oficina?",
            context: { contactName: "Andrés Gomez", source: "client" }
        }
    ];

    for (const test of testCases) {
        console.log(`\n---------------------------------------`);
        console.log(`📡 ${test.name}`);
        console.log(`👤 WhatsApp: "${test.text}"`);

        try {
            const digest = await alejandraService.identifyAndTranslate(test.text, {
                chatId: test.chatId,
                ...test.context,
                source: test.context.source || 'client'
            });

            console.log(`🤖 [Alejandra Response]`);
            console.log(`   Needs Clarification: ${digest.needs_clarification}`);
            console.log(`   Question/Intro: "${digest.clarification_question}"`);
            console.log(`   Digest: "${digest.digest}"`);

        } catch (error: any) {
            console.error('❌ Error en test:', error.message);
        }
    }

    console.log('\n🏁 AUDITORÍA DE REFINAMIENTO FINALIZADA.');
    process.exit(0);
}

runRefinedAudit();
