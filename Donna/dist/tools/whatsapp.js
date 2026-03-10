import { z } from "zod";
// ---------------------------------------------------------------------------
// Tool: whatsapp_send_message
// Uses Evolution API to send WhatsApp messages on César's behalf
// ---------------------------------------------------------------------------
export const whatsappSendSchema = z.object({
    number: z.string().describe("Número de teléfono con código de país, sin el signo +. Ejemplo: 593987654321"),
    message: z.string().describe("Texto del mensaje a enviar por WhatsApp"),
});
export const whatsappSendDefinition = {
    type: "function",
    function: {
        name: "whatsapp_send_message",
        description: "Envía un mensaje de WhatsApp a un número de teléfono usando la cuenta de César. Úsalo para avisar a clientes, confirmar citas, notificar al equipo (Abel, etc). Siempre redacta el mensaje en español y con el tono adecuado al contexto.",
        parameters: {
            type: "object",
            properties: {
                number: { type: "string", description: "Número de teléfono con código de país sin el + (ej: 593966410409)" },
                message: { type: "string", description: "Mensaje a enviar" },
            },
            required: ["number", "message"],
        },
    },
};
export async function executeWhatsappSend(args) {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;
    if (!baseUrl || !apiKey || !instance) {
        return "❌ WhatsApp no está configurado. Falta EVOLUTION_API_URL, EVOLUTION_API_KEY o EVOLUTION_INSTANCE en las variables de entorno.";
    }
    try {
        const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": apiKey,
            },
            body: JSON.stringify({
                number: args.number,
                text: args.message,
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.message ?? `HTTP ${res.status}`);
        }
        return `✅ Mensaje de WhatsApp enviado a ${args.number}: "${args.message}"`;
    }
    catch (err) {
        return `❌ Error enviando WhatsApp: ${err.message}`;
    }
}
