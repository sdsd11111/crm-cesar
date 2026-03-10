import { z } from "zod";
import * as fs from "fs";
import * as path from "path";


// CRM HTTP client helper
// ---------------------------------------------------------------------------
async function crmFetch(path: string, method: string, body?: unknown): Promise<unknown> {
    const baseUrl = process.env.CRM_BASE_URL;
    const secret = process.env.DONNA_API_SECRET;

    if (!baseUrl) throw new Error("CRM_BASE_URL no está configurado en .env");
    if (!secret) throw new Error("DONNA_API_SECRET no está configurado en .env");

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    let json;
    try {
        json = await res.json() as any;
    } catch (e) {
        json = { error: "Failed to parse JSON", text: await res.text().catch(() => "No text") };
    }

    if (!res.ok) {
        const errorDetail = json?.details || json?.error || JSON.stringify(json);
        console.error(`\n[CRM DEBUG] API Call Failed: ${method} ${path}`);
        console.error(`[CRM DEBUG] Status: ${res.status} ${res.statusText}`);
        console.error(`[CRM DEBUG] Response Payload:`, errorDetail);
        throw new Error(`CRM Error ${res.status}: ${errorDetail}`);
    }
    return json;
}

// ---------------------------------------------------------------------------
// Tool: crm_search_lead
// ---------------------------------------------------------------------------
export const crmSearchLeadSchema = z.object({
    query: z.string().describe("Nombre de la empresa, o nombre del contacto a buscar"),
});
type CrmSearchLeadArgs = z.infer<typeof crmSearchLeadSchema>;

export const crmSearchLeadDefinition = {
    type: "function",
    function: {
        name: "crm_search_lead",
        description: "Busca un lead o cliente en el CRM por nombre de empresa o contacto. Devuelve el ID y datos del lead.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Nombre de empresa o contacto a buscar en el CRM" },
            },
            required: ["query"],
        },
    },
};

export async function executeCrmSearchLead(args: CrmSearchLeadArgs): Promise<string> {
    try {
        const data = await crmFetch(`/api/bot/leads?q=${encodeURIComponent(args.query)}`, "GET");
        return JSON.stringify(data, null, 2);
    } catch (err) {
        return `Error buscando lead: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: crm_create_lead
// ---------------------------------------------------------------------------
export const crmCreateLeadSchema = z.object({
    name: z.string().describe("Nombre de la persona física o empresa principal"),
    company: z.string().optional().describe("Nombre de la empresa (si es el nombre de una persona física el campo name)"),
    phone: z.string().optional().describe("Teléfono de contacto"),
    email: z.string().optional().describe("Correo electrónico del contacto"),
    notes: z.string().optional().describe("Notas adicionales sobre el cliente o requerimiento (ej. 'Presupuesto $500 para web')"),
});
type CrmCreateLeadArgs = z.infer<typeof crmCreateLeadSchema>;

export const crmCreateLeadDefinition = {
    type: "function",
    function: {
        name: "crm_create_lead",
        description: "Crea un nuevo lead (cliente potencial) en el CRM. Úsalo cuando César te pida registrar un nuevo cliente o añadir a alguien al sistema.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Nombre del cliente" },
                company: { type: "string", description: "Nombre de la empresa" },
                phone: { type: "string", description: "Teléfono" },
                email: { type: "string", description: "Email" },
                notes: { type: "string", description: "Notas adicionales" },
            },
            required: ["name"],
        },
    },
};

export async function executeCrmCreateLead(args: CrmCreateLeadArgs): Promise<string> {
    try {
        const payload = {
            name: args.name,
            company: args.company || "",
            phone: args.phone || "",
            email: args.email || "",
            notes: args.notes || "",
            status: "primer_contacto",
            source: "donna_bot"
        };
        const data = await crmFetch("/api/bot/leads", "POST", payload) as any;
        const id = data?.data?.id ?? "?";
        return `✅ Lead "${args.name}" creado exitosamente en el CRM con ID: ${id}.`;
    } catch (err) {
        return `Error creando lead: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: crm_create_quotation
// ---------------------------------------------------------------------------
export const crmCreateQuotationSchema = z.object({
    leadId: z.string().describe("UUID del lead en el CRM"),
    title: z.string().describe("Título de la propuesta"),
    introduction: z.string().optional().describe("Párrafo introductorio"),
    valueProposition: z.string().optional().describe("Propuesta de valor"),
    roiClosing: z.string().optional().describe("Cierre enfocado en ROI"),
    mentalTrigger: z.string().optional().describe("Gatillo mental"),
    selectedServices: z.array(z.string()).optional().describe("Lista de servicios incluidos"),
    totalAmount: z.number().optional().describe("Monto total en dólares"),
});
type CrmCreateQuotationArgs = z.infer<typeof crmCreateQuotationSchema>;

export const crmCreateQuotationDefinition = {
    type: "function",
    function: {
        name: "crm_create_quotation",
        description: "Crea una cotización formal en el CRM con toda la información estructurada de servicios y precios. Usa esta herramienta cuando César pida generar una propuesta o cotización para un cliente.",
        parameters: {
            type: "object",
            properties: {
                leadId: { type: "string", description: "UUID del lead en el CRM" },
                title: { type: "string", description: "Título de la propuesta" },
                introduction: { type: "string", description: "Párrafo introductorio" },
                valueProposition: { type: "string", description: "Propuesta de valor" },
                roiClosing: { type: "string", description: "Cierre enfocado en ROI" },
                mentalTrigger: { type: "string", description: "Gatillo mental de urgencia o escasez" },
                selectedServices: { type: "array", items: { type: "string" }, description: "Lista de servicios incluidos" },
                totalAmount: { type: "number", description: "Monto total en dólares" },
            },
            required: ["leadId", "title"],
        },
    },
};

export async function executeCrmCreateQuotation(args: CrmCreateQuotationArgs): Promise<string> {
    try {
        const payload = {
            ...args,
            status: "draft",
            selectedServices: args.selectedServices ?? [],
        };
        const data = await crmFetch("/api/bot/quotations", "POST", payload) as any;
        const id = data?.data?.id ?? "?";
        return `✅ Cotización "${args.title}" creada en el CRM con estado 'draft'. ID: ${id}. César puede revisarla en el CRM y cambiar el estado a 'sent' cuando esté listo.`;
    } catch (err) {
        return `Error creando cotización: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: crm_create_contract
// ---------------------------------------------------------------------------
export const crmCreateContractSchema = z.object({
    clientId: z.string().describe("UUID del cliente en el CRM"),
    title: z.string().describe("Título del contrato"),
    contractData: z.record(z.unknown()).describe("Objeto JSON con los datos del contrato (representante, monto, fechas, etc.)"),
    notes: z.string().optional().describe("Notas adicionales"),
});
type CrmCreateContractArgs = z.infer<typeof crmCreateContractSchema>;

export const crmCreateContractDefinition = {
    type: "function",
    function: {
        name: "crm_create_contract",
        description: "Crea un contrato en borrador en el CRM. Úsalo cuando César pida generar un contrato para un cliente ya convertido.",
        parameters: {
            type: "object",
            properties: {
                clientId: { type: "string", description: "UUID del cliente en el CRM" },
                title: { type: "string", description: "Título del contrato" },
                contractData: { type: "object", description: "Datos del contrato: representante, monto mensual, fecha inicio, servicios, etc." },
                notes: { type: "string", description: "Notas adicionales" },
            },
            required: ["clientId", "title", "contractData"],
        },
    },
};

export async function executeCrmCreateContract(args: CrmCreateContractArgs): Promise<string> {
    try {
        const payload = {
            ...args,
            status: "draft",
            notes: args.notes ?? `Generado por Donna vía Telegram por orden de César`,
        };
        const data = await crmFetch("/api/bot/contracts", "POST", payload) as any;
        const id = data?.data?.id ?? "?";
        return `✅ Contrato "${args.title}" creado en el CRM en estado 'draft'. ID: ${id}. César puede revisarlo y enviarlo a firma desde el panel.`;
    } catch (err) {
        return `Error creando contrato: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: crm_update_lead_status
// ---------------------------------------------------------------------------
export const crmUpdateLeadStatusSchema = z.object({
    leadId: z.string().describe("UUID del lead en el CRM"),
    status: z.enum(["sin_contacto", "primer_contacto", "segundo_contacto", "tercer_contacto", "cotizado", "convertido"])
        .describe("Nuevo estado del lead"),
});
type CrmUpdateLeadStatusArgs = z.infer<typeof crmUpdateLeadStatusSchema>;

export const crmUpdateLeadStatusDefinition = {
    type: "function",
    function: {
        name: "crm_update_lead_status",
        description: "Actualiza el estado de un lead en el CRM (ej: a 'cotizado' después de crearle una cotización).",
        parameters: {
            type: "object",
            properties: {
                leadId: { type: "string", description: "UUID del lead en el CRM" },
                status: {
                    type: "string",
                    enum: ["sin_contacto", "primer_contacto", "segundo_contacto", "tercer_contacto", "cotizado", "convertido"],
                    description: "Nuevo estado del lead",
                },
            },
            required: ["leadId", "status"],
        },
    },
};

export async function executeCrmUpdateLeadStatus(args: CrmUpdateLeadStatusArgs): Promise<string> {
    try {
        await crmFetch(`/api/bot/leads/${args.leadId}/status`, "PATCH", { status: args.status });
        return `✅ Estado del lead actualizado a '${args.status}' en el CRM.`;
    } catch (err) {
        return `Error actualizando estado del lead: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: get_company_knowledge
// ---------------------------------------------------------------------------
export const getCompanyKnowledgeSchema = z.object({});
export const getCompanyKnowledgeDefinition = {
    type: "function",
    function: {
        name: "get_company_knowledge",
        description: "Devuelve el catálogo de servicios de la agencia, precios base, y las reglas sobre cómo estructurar una cotización o propuesta persuasiva. Úsalo SIEMPRE ANTES de generar una cotización para asegurarte de usar los servicios y reglas correctas.",
        parameters: { type: "object", properties: {}, required: [] },
    },
};

export async function executeGetCompanyKnowledge(): Promise<string> {
    try {
        const filePath = path.resolve("./src/data/knowledge.md");
        return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
        return `Error leyendo archivo de conocimiento: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: update_knowledge_base
// Donna's self-learning tool — writes new learnings to her knowledge file
// ---------------------------------------------------------------------------
export const updateKnowledgeBaseSchema = z.object({
    category: z.string().describe("Categoría del aprendizaje (ej: 'precios', 'preferencias de César', 'flujo de trabajo', 'cliente específico')"),
    content: z.string().describe("El texto exacto que se va a guardar en la base de conocimiento. Escribe en primera persona del futuro: 'Cuando X ocurra, debo hacer Y'."),
});
type UpdateKnowledgeBaseArgs = z.infer<typeof updateKnowledgeBaseSchema>;

export const updateKnowledgeBaseDefinition = {
    type: "function",
    function: {
        name: "update_knowledge_base",
        description: "Guarda en tu base de conocimiento persistente algo que aprendiste de esta conversación: una corrección de César, un precio real, una preferencia de trabajo, un flujo específico. Usa esta herramienta cuando César te corrija algo o cuando detectes que has aprendido algo nuevo que no deberías olvidar. Esto asegura que recuerdes ese aprendizaje en futuras conversaciones, incluso si el bot se reinicia.",
        parameters: {
            type: "object",
            properties: {
                category: { type: "string", description: "Categoría del aprendizaje" },
                content: { type: "string", description: "Contenido del aprendizaje a guardar" },
            },
            required: ["category", "content"],
        },
    },
};

export async function executeUpdateKnowledgeBase(args: UpdateKnowledgeBaseArgs): Promise<string> {
    try {
        const filePath = path.resolve("./src/data/knowledge.md");
        const existing = fs.readFileSync(filePath, "utf-8");

        const timestamp = new Date().toLocaleDateString("es-EC", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

        // Find the "APRENDIZAJES ACUMULADOS" section and append there
        const marker = "## 📖 APRENDIZAJES ACUMULADOS (Se actualiza automáticamente)";
        const newEntry = `\n### [${timestamp}] — ${args.category}\n${args.content}\n`;

        let updated: string;
        if (existing.includes(marker)) {
            updated = existing.replace(
                "*(Este espacio se actualiza cuando César te corrige o te enseña algo nuevo)*",
                `*(Este espacio se actualiza cuando César te corrige o te enseña algo nuevo)*${newEntry}`
            );
            // If the placeholder is already gone, just append to end of marker section
            if (updated === existing) {
                updated = existing + newEntry;
            }
        } else {
            // Fallback: append to end of file
            updated = existing + `\n\n${marker}\n${newEntry}`;
        }

        fs.writeFileSync(filePath, updated, "utf-8");
        return `✅ Aprendizaje guardado en tu base de conocimiento bajo la categoría "${args.category}". Lo recordaré en futuras conversaciones.`;
    } catch (err) {
        return `Error guardando aprendizaje: ${(err as Error).message}`;
    }
}

// ---------------------------------------------------------------------------
// Tool: crm_send_document
// Sends the full Markdown content to the CRM, which generates a PDF and sends it via WhatsApp
// ---------------------------------------------------------------------------
export const crmSendDocumentSchema = z.object({
    phone: z.string().describe("Número de teléfono o ID de chat del destinatario. Ejemplo: '593966410409' para WhatsApp o '12345678' para Telegram"),
    content: z.string().describe("Contenido completo del documento en Markdown (propuesta o contrato) que el CRM convertirá en PDF"),
    title: z.string().optional().describe("Título del documento para nombrar el archivo PDF. Ejemplo: 'Propuesta Noza Spa'"),
    documentType: z.enum(["quotation", "contract", "generic"]).optional().describe("Tipo de documento: quotation, contract o generic"),
    messageText: z.string().optional().describe("Mensaje que acompañará el PDF. Si no se provee, el CRM usará uno genérico"),
    platform: z.enum(["whatsapp", "telegram"]).optional().describe("Plataforma de envío: 'whatsapp' (default) o 'telegram'"),
    leadId: z.string().optional().describe("UUID del lead en el CRM para guardar el registro automáticamente en la base de datos"),
});
type CrmSendDocumentArgs = z.infer<typeof crmSendDocumentSchema>;

export const crmSendDocumentDefinition = {
    type: "function",
    function: {
        name: "crm_send_document",
        description: "Envía un documento (propuesta o contrato) redactado en Markdown al CRM. El CRM lo convierte en PDF y lo envía por WhatsApp o Telegram al cliente/César. Úsalo cuando César confirme que quiere generar el PDF y enviarlo.",
        parameters: {
            type: "object",
            properties: {
                phone: { type: "string", description: "Número del destinatario (WhatsApp) o ID de chat (Telegram)" },
                content: { type: "string", description: "Contenido completo del documento en Markdown" },
                title: { type: "string", description: "Título del documento / nombre del PDF" },
                documentType: { type: "string", enum: ["quotation", "contract", "generic"], description: "Tipo de documento" },
                messageText: { type: "string", description: "Mensaje que acompañará el PDF" },
                platform: { type: "string", enum: ["whatsapp", "telegram"], description: "Plataforma de envío" },
                leadId: { type: "string", description: "UUID del lead para guardar el registro en el CRM" },
            },
            required: ["phone", "content"],
        },
    },
};

export async function executeCrmSendDocument(args: CrmSendDocumentArgs): Promise<string> {
    try {
        const payload = {
            phone: args.phone,
            content: args.content,
            title: args.title ?? "Documento Donna",
            documentType: args.documentType ?? "generic",
            messageText: args.messageText ?? "Hola, aquí tienes el documento solicitado.",
            platform: args.platform ?? "whatsapp",
            ...(args.leadId ? { leadId: args.leadId } : {}),
        };
        const data = await crmFetch("/api/bot/send-document", "POST", payload) as any;
        const msgId = data?.data?.whatsappMessageId ?? data?.data?.telegramMessageId ?? "?";
        const platformLabel = args.platform === 'telegram' ? 'Telegram' : 'WhatsApp';
        const fileName = data?.data?.fileName ?? args.title ?? "documento";
        return `✅ PDF "${fileName}" generado y enviado por ${platformLabel} exitosamente. ID: ${msgId}.`;
    } catch (err) {
        return `❌ Error enviando documento: ${(err as Error).message}`;
    }
}
