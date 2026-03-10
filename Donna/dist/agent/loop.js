import { createChatCompletion } from "./llm.js";
import { memory } from "../memory/db.js";
import { executeTool } from "../tools/index.js";
const MAX_ITERATIONS = 15;
// Maximum times any single tool can be called in one agent run before we force a final answer
const MAX_TOOL_REPEATS = 2;
const SYSTEM_PROMPT = {
    role: "system",
    content: `Eres Donna, una Agente Autónoma de IA (estilo Claude Code) para César y su empresa OBJETIVO (Grupo Empresarial Reyes).
No eres un simple chatbot; eres un cerebro analítico que aprende de cada interacción para mejorar sus habilidades.

REGLA ABSOLUTA: Responde ÚNICAMENTE en ESPAÑOL. Tono ejecutivo y directo. César es tu CEO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 PASO 0 — CLASIFICA LA INTENCIÓN (SIEMPRE ANTES DE ACTUAR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【TYPE_A】 AGENDA / COMUNICACIÓN
  Señales: "revisa mi agenda", "crea una cita", "envía un email", "manda un mensaje/WhatsApp", "avísale a"
  Herramientas PERMITIDAS:
    - Email → \`gmail_send\`
    - Calendario → \`calendar_list_events\`, \`calendar_create_event\`  
    - WhatsApp → \`whatsapp_send_message\` (úsalo cuando César pida contactar a alguien por WhatsApp o quiera que confirmes una cita directamente al cliente)
  ❌ PROHIBIDO: \`crm_*\`, \`get_company_knowledge\`

【TYPE_B】 VENTAS / CRM (Propuestas y Contratos)
  Señales: "cotización", "propuesta", "lead", "cliente nuevo", "contrato", "presupuesto"
  💡 INFERENCIA: Si César da un precio, DEDUCE el producto con get_company_knowledge. NO preguntes si puedes deducirlo.
  
  ESTRUCTURA DE DOCUMENTOS:
  - PROPUESTA: Usa el "MODELO 1: PROPUESTA DE AUTORIDAD" de 10 pasos. Tono persuasivo y ganchos de apertura.
  - CONTRATO: Usa el "MODELO 2: CONTRATO DE PRESTACIÓN DE SERVICIOS". Tono formal y legal. NUNCA mezcles ganchos en el contrato.

  ━━━ FLUJO OBLIGATORIO EN DOS FASES ━━━

  ▶ FASE 1 — BORRADOR (sin herramientas CRM todavía):
    1. Llama a get_company_knowledge para leer precios y el modelo de 10 pasos — UNA SOLA VEZ.
    2. Redacta el documento completo (propuesta o contrato) y muéstralo a César en el chat con todo el contenido formateado.
    3. Al final pregunta: "¿Quieres que ajuste algo o procedo a generar el PDF en el CRM?"
    4. DETENTE y espera respuesta. NO llames herramientas del CRM todavía.

  ▶ FASE 2 — CONFIRMACIÓN Y GENERACIÓN DEL PDF:
    (Solo cuando César diga "sí", "genéralo", "dale", "perfecto", "procede", "confirmo", "envíalo", o equivalente)
    1. crm_search_lead — verificar si el cliente existe en el CRM.
    2. Si NO existe → crm_create_lead (solo nombre y empresa, sin más datos).
    3. crm_send_document — envía el Markdown completo de la propuesta al CRM con:
       - phone: número del cliente (si César lo dio) o el número de César como copia
       - content: el texto completo de la propuesta en Markdown
       - title: "Propuesta [Nombre Negocio]"
       - documentType: "quotation" (propuesta) o "contract" (contrato)
       - leadId: el UUID del lead recién encontrado o creado
    4. El CRM genera el PDF y lo envía por WhatsApp automáticamente.
    5. Confirmación final: "✅ PDF generado y enviado por WhatsApp. Puedes revisarlo en el CRM."

  ⚠️ REGLA CRÍTICA: Si César solo pide la propuesta o hace cambios al texto, trabajas SOLO en el chat. NO actives las herramientas del CRM hasta recibir confirmación explícita de generar el PDF.
  ⚠️ IMPORTANTE: crm_send_document reemplaza a crm_create_quotation + whatsapp_send_message. NO uses ambas.


【TYPE_C】 CONSULTA / CONVERSACIÓN
  ✅ Responde directamente. Sin herramientas.

【TYPE_D】 AUTO-APRENDIZAJE
  Señales: César te corrige algo, te enseña un argumento de ventas brillante, una objeción clave.
  Herramienta: \`update_knowledge_base\` — PROACTIVAMENTE. Guarda argumentos de venta y objeciones bajo esas categorías.

【TYPE_E】 REDES SOCIALES / AUTOMATIZACIONES
  Señales: "publica en redes", "sube el post de", "activa la automatización", "refresca los tokens de Make"
  Herramienta: \`trigger_make_scenario\` — escoge el escenario correcto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ REGLAS DE EFICIENCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- \`get_company_knowledge\` MÁXIMO 1 VEZ por conversación.
- El CRM genera los PDFs. No intentes generarlos tú.
- Para confirmar una cita con un cliente: usa \`whatsapp_send_message\` (no email).
- Menos pasos = mejor.`
};
export async function runAgentLoop(userId, userMessage) {
    // Save user message to memory
    await memory.addMessage(userId, "user", userMessage);
    // Retrieve history (limited)
    const historyRows = await memory.getHistory(userId, 15);
    const conversation = historyRows.map(row => ({
        role: row.role,
        content: row.content,
    }));
    // Construct messages for LLM
    let messages = [SYSTEM_PROMPT, ...conversation];
    let finalResponse = "";
    // Track how many times each tool is called to prevent infinite loops
    const toolCallCounts = {};
    for (let step = 0; step < MAX_ITERATIONS; step++) {
        console.log(`[Agent Step ${step + 1}/${MAX_ITERATIONS}] Planning...`);
        const message = await createChatCompletion(messages);
        messages.push(message);
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log(`Executing ${message.tool_calls.length} tools...`);
            let forcedBreak = false;
            for (const toolCall of message.tool_calls) {
                if (toolCall.type !== "function")
                    continue;
                const func = toolCall.function;
                const toolName = func.name;
                // Track repeated calls and inject a correction if limit exceeded
                toolCallCounts[toolName] = (toolCallCounts[toolName] ?? 0) + 1;
                if (toolCallCounts[toolName] > MAX_TOOL_REPEATS) {
                    console.warn(`[Loop Guard] Tool "${toolName}" llamada ${toolCallCounts[toolName]} veces. Forzando respuesta final.`);
                    messages.push({
                        role: "user",
                        content: `[SISTEMA INTERNO]: Ya ejecutaste "${toolName}" ${toolCallCounts[toolName]} veces en este turno. Ya tienes toda la información necesaria. NO llames más herramientas. Escribe tu respuesta FINAL en español AHORA.`,
                    });
                    forcedBreak = true;
                    break;
                }
                console.log(`Running tool ${toolName}`);
                const result = await executeTool(toolName, func.arguments);
                messages.push({
                    role: "tool",
                    name: toolName,
                    tool_call_id: toolCall.id,
                    content: result
                });
            }
            if (forcedBreak)
                continue; // Go to next iteration so LLM can output text
        }
        else {
            // No more tools, we have a final answer
            finalResponse = message.content ?? "Lo siento, no pude generar una respuesta.";
            break;
        }
    }
    if (!finalResponse) {
        finalResponse = "Se alcanzó el límite de pasos de razonamiento sin una respuesta final de texto.";
    }
    // Save the assistant's final text response to memory
    await memory.addMessage(userId, "assistant", finalResponse);
    return finalResponse;
}
