import { documentIntelligenceService } from '../lib/donna/services/DocumentIntelligenceService';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log('--- TEST: Cerebro 1 Product Recognizer ---');
    try {
        const userInput = "Cesar amigo quiero que me cotices una pagina web y el pro crm que tienes. Mi nombre es Jose de La casa de la tia omaira";
        const result = await documentIntelligenceService.recognizeProducts(userInput);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

runTest();
