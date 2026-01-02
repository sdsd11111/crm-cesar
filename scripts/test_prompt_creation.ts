import { getAIClient, getModelId } from '../lib/ai/client';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPrompt() {
    console.log('🧪 TEST DE PROMPT DE CREACIÓN\n');

    const input = "Agenda reunión para el sábado a las 3pm con los propietarios del gimnasio titanus";
    console.log(`Input: "${input}"\n`);

    const promptsDir = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'agenda');
    const promptPath = path.join(promptsDir, 'create_event.md');
    let promptTpl = fs.readFileSync(promptPath, 'utf-8');

    const now = new Date();
    promptTpl = promptTpl
        .replace('{{INPUT}}', input)
        .replace('{{CURRENT_DATE}}', format(now, 'yyyy-MM-dd'))
        .replace('{{CURRENT_DAY_NAME}}', format(now, 'EEEE', { locale: es }))
        .replace('{{CURRENT_TIME}}', format(now, 'HH:mm'));

    console.log('🤖 Consultando AI...');
    console.time('AI Response');

    const ai = getAIClient('STANDARD');
    const response = await ai.chat.completions.create({
        model: getModelId('STANDARD'),
        messages: [{ role: 'user', content: promptTpl }],
        temperature: 0,
        response_format: { type: "json_object" }
    });

    console.timeEnd('AI Response');

    const data = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log('\n📦 Resultado JSON:');
    console.log(JSON.stringify(data, null, 2));

    if (data.status === 'incomplete') {
        console.log(`\n❓ PREGUNTA DONNA: "${data.pregunta}"`);
        console.log(`❌ Faltante: ${data.faltante.join(', ')}`);
    } else if (data.status === 'ready') {
        const evt = data.evento;
        console.log(`\n✅ LISTO PARA AGENDAR:`);
        console.log(`   Título: "${evt.titulo}"`);
        console.log(`   Para: "${evt.para}"`);
        console.log(`   Fecha: ${evt.fecha}`);
        console.log(`   Hora: ${evt.hora}`);
        console.log(`   Lugar: ${evt.lugar}`);
    } else {
        console.log('\n⚠️ Formato desconocido');
    }
}

testPrompt().catch(console.error);
