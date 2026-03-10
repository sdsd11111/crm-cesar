import dotenv from 'dotenv';
import path from 'path';
import { executeCrmSendDocument } from './crm.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Ensure it reads from project root

async function runTest() {
    console.log("🚀 Iniciando prueba de generación de PDF y envío por WhatsApp...");
    console.log(`🔌 CRM URL conectada: ${process.env.CRM_BASE_URL}`);

    const testMarkdown = `
# COMPROBANTE DE SISTEMA ACTIVO  
________________________________________

### PRESENTACIÓN  
Estimado César, esta es una prueba generada en vivo por Donna e inyectada al CRM mediante HTTP.  

El CRM recibió este texto (en formato Markdown puro), y su propio servidor lo ha renderizado como un archivo .pdf, para inmediatamente despacharlo por WhatsApp hacia ti usando la API de Evolution y el Token Configurado.

Si estás leyendo esto en tu celular, significa que **TODO** el flujo (\`Donna -> CRM API POST -> React PDF -> WhatsApp API -> Tu Celular\`) funciona sin intervención humana.

### LO QUE SE HA LOGRADO  
- Autenticación Segura (Bearer Token M2M)
- Conversión HTML/Markdown a PDF en Memoria.
- Subida a Meta/Evolution y envío de Mensaje WhatsApp.

________________________________________

### INVERSIÓN Y VALOR  
- Arquitectura Inicial: $0
- Funciones Integradas: $0 

________________________________________

### EL RESULTADO  
- Ahorro drástico de horas de trabajo operativas.
- Proceso 100% libre de fricción.

________________________________________

Ing. César Augusto Reyes Jaramillo  
OBJETIVO  
www.cesarreyesjaramillo.com  
WhatsApp: +593 96 341 0409  
negocios@cesarreyesjaramillo.com
`;

    const args = {
        phone: '593966410409',
        content: testMarkdown,
        title: 'Documento Prueba Integracion',
        documentType: 'quotation' as const,
        messageText: '¡Prueba enviada desde Donna! Si puedes abrir el PDF sin problema, significa que el endpoint del CRM funciona perfecto. 😎',
    };

    console.log("\\nEnviando Payload: ", { ...args, content: args.content.slice(0, 50) + "..." });
    console.log("Esperando respuesta del CRM (esto puede demorar unos 4-8 segundos mientras se dibuja el PDF)...");

    const result = await executeCrmSendDocument(args);

    console.log("\\n-----------------------------------------");
    console.log("📊 RESPUESTA RECIBIDA:");
    console.log(result);
    console.log("-----------------------------------------");
}

runTest().catch(console.error);
