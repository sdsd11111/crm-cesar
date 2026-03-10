import { pdfDocumentService } from '../lib/donna/services/PdfDocumentService';
import fs from 'fs';

async function test() {
    console.log('Testing JSON parsing logic...');

    const rawContent = `\`\`\`json
{
"intent": "COTIZACION",
"data": {
"response": "## PROPUESTA DE DESARROLLO WEB\\n### Loxa\\n\\n--- \\n\\n**Inversión**: $400"
},
"reasoning": "La propuesta"
}
\`\`\``;

    let docContent = rawContent;

    // 1. Strip ALL markdown formatting BEFORE trying to parse
    // The AI might return ```json ... ``` or just the raw JSON
    let cleanContentForJson = rawContent.trim();
    if (cleanContentForJson.startsWith('\`\`\`')) {
        // Remove first line (e.g. ```json)
        cleanContentForJson = cleanContentForJson.replace(/^\`\`\`[a-zA-Z]*\n/, '');
        // Remove last line (e.g. ```)
        cleanContentForJson = cleanContentForJson.replace(/\n\`\`\`$/, '');
    }

    try {
        const parsedContent = JSON.parse(cleanContentForJson);
        if (parsedContent.data?.response) {
            docContent = parsedContent.data.response;
            console.log("✅ Successfully parsed JSON and extracted response!");
        }
    } catch (e) {
        console.log("❌ Failed to parse JSON:", e);
    }

    // Clean up markdown code blocks if the AI wraps it like ```markdown ... ``` (fallback for RAW markdown)
    docContent = docContent.replace(/^\`\`\`markdown\n/m, '').replace(/\`\`\`$/m, '').trim();

    console.log("------------------------");
    console.log("FINAL DOC CONTENT TO VUE TO PDF:");
    console.log(docContent);
    console.log("------------------------");

    console.log('Generating PDF...');
    const buffer = await pdfDocumentService.generatePdf(docContent, 'quotation', {
        clientName: 'Loxa Test',
        signerName: 'César Reyes'
    });

    fs.writeFileSync('./public/test-cotizacion.pdf', buffer);
    console.log('Saved to ./public/test-cotizacion.pdf');
}

test().catch(console.error);
