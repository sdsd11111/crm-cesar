import { z } from "zod";
import { authorize } from "./googleAuth.js";
import { google } from "googleapis";
// ---------------------------------------------------------------------------
// Tool: gmail_search
// ---------------------------------------------------------------------------
export const gmailSearchSchema = z.object({
    query: z.string().describe("Gmail search query (e.g. 'newer_than:7d is:unread')"),
    max: z.number().int().min(1).max(50).default(10).describe("Maximum number of results"),
});
export const gmailSearchDefinition = {
    type: "function",
    function: {
        name: "gmail_search",
        description: "Busca correos en Gmail usando una consulta. Retorna un resumen de los correos encontrados.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Consulta de búsqueda de Gmail (ej: 'newer_than:7d is:unread')" },
                max: { type: "number", description: "Número máximo de resultados (1-50, por defecto 10)" },
            },
            required: ["query"],
        },
    },
};
export async function executeGmailSearch(args) {
    try {
        const auth = await authorize();
        const gmail = google.gmail({ version: "v1", auth });
        const response = await gmail.users.messages.list({
            userId: "me",
            q: args.query,
            maxResults: args.max ?? 10
        });
        const messages = response.data.messages;
        if (!messages || messages.length === 0) {
            return "No se encontraron correos.";
        }
        let resultText = `Se encontraron ${messages.length} correos:\n`;
        for (const msg of messages) {
            const msgData = await gmail.users.messages.get({
                userId: "me",
                id: msg.id
            });
            const payload = msgData.data.payload;
            const headers = payload?.headers;
            const subject = headers?.find(h => h.name === "Subject")?.value || "Sin Asunto";
            const from = headers?.find(h => h.name === "From")?.value || "Desconocido";
            resultText += `- De: ${from} | Asunto: ${subject}\n`;
        }
        return resultText;
    }
    catch (error) {
        return `Error en gmail_search: ${error.message}`;
    }
}
// ---------------------------------------------------------------------------
// Tool: gmail_send
// ---------------------------------------------------------------------------
export const gmailSendSchema = z.object({
    to: z.string().describe("Dirección de correo del destinatario"),
    subject: z.string().describe("Asunto del correo"),
    body: z.string().describe("Cuerpo del mensaje en texto plano"),
});
export const gmailSendDefinition = {
    type: "function",
    function: {
        name: "gmail_send",
        description: "Envía un correo electrónico desde Gmail.",
        parameters: {
            type: "object",
            properties: {
                to: { type: "string", description: "Dirección de correo del destinatario" },
                subject: { type: "string", description: "Asunto del correo" },
                body: { type: "string", description: "Cuerpo del mensaje en texto plano" },
            },
            required: ["to", "subject", "body"],
        },
    },
};
export async function executeGmailSend(args) {
    try {
        const auth = await authorize();
        const gmail = google.gmail({ version: "v1", auth });
        // El formato de mensaje de Gmail requiere Base64Url
        const utf8Subject = `=?utf-8?B?${Buffer.from(args.subject).toString("base64")}?=`;
        const messageParts = [
            `To: ${args.to}`,
            `Subject: ${utf8Subject}`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=utf-8",
            "",
            args.body,
        ];
        const message = messageParts.join("\n");
        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        const res = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: encodedMessage
            }
        });
        return `Correo enviado correctamente a ${args.to}. ID: ${res.data.id}`;
    }
    catch (error) {
        return `Error enviando correo: ${error.message}`;
    }
}
// ---------------------------------------------------------------------------
// Tool: calendar_list_events
// ---------------------------------------------------------------------------
export const calendarListSchema = z.object({
    calendar_id: z.string().default("primary").describe("ID del calendario (por defecto 'primary')"),
    from: z.string().describe("Fecha de inicio en formato ISO 8601 (ej: 2024-03-01T00:00:00Z)"),
    to: z.string().describe("Fecha de fin en formato ISO 8601 (ej: 2024-03-31T23:59:59Z)"),
});
export const calendarListDefinition = {
    type: "function",
    function: {
        name: "calendar_list_events",
        description: "Muestra los eventos del calendario de Google para un rango de fechas.",
        parameters: {
            type: "object",
            properties: {
                calendar_id: { type: "string", description: "ID del calendario (por defecto 'primary')" },
                from: { type: "string", description: "Fecha de inicio ISO 8601 (ej: 2024-03-01T00:00:00Z)" },
                to: { type: "string", description: "Fecha de fin ISO 8601 (ej: 2024-03-31T23:59:59Z)" },
            },
            required: ["from", "to"],
        },
    },
};
export async function executeCalendarList(args) {
    try {
        const auth = await authorize();
        const calendar = google.calendar({ version: "v3", auth });
        const response = await calendar.events.list({
            calendarId: args.calendar_id ?? "primary",
            timeMin: args.from,
            timeMax: args.to,
            maxResults: 15,
            singleEvents: true,
            orderBy: "startTime"
        });
        const events = response.data.items;
        if (!events || events.length === 0) {
            return "No se encontraron eventos en ese rango.";
        }
        let resultText = `Eventos encontrados:\n`;
        for (const event of events) {
            const start = event.start?.dateTime || event.start?.date;
            resultText += `- ${start}: ${event.summary}\n`;
        }
        return resultText;
    }
    catch (error) {
        return `Error listando eventos: ${error.message}`;
    }
}
// ---------------------------------------------------------------------------
// Tool: calendar_create_event
// ---------------------------------------------------------------------------
export const calendarCreateSchema = z.object({
    summary: z.string().describe("Título del evento"),
    from: z.string().describe("Fecha y hora de inicio en formato ISO 8601"),
    to: z.string().describe("Fecha y hora de fin en formato ISO 8601"),
    calendar_id: z.string().default("primary").describe("ID del calendario (por defecto 'primary')"),
});
export const calendarCreateDefinition = {
    type: "function",
    function: {
        name: "calendar_create_event",
        description: "Crea un nuevo evento en Google Calendar.",
        parameters: {
            type: "object",
            properties: {
                summary: { type: "string", description: "Título del evento" },
                from: { type: "string", description: "Fecha y hora de inicio ISO 8601" },
                to: { type: "string", description: "Fecha y hora de fin ISO 8601" },
                calendar_id: { type: "string", description: "ID del calendario (por defecto 'primary')" },
            },
            required: ["summary", "from", "to"],
        },
    },
};
export async function executeCalendarCreate(args) {
    try {
        const auth = await authorize();
        const calendar = google.calendar({ version: "v3", auth });
        const event = {
            summary: args.summary,
            start: {
                dateTime: args.from,
            },
            end: {
                dateTime: args.to,
            }
        };
        const res = await calendar.events.insert({
            calendarId: args.calendar_id ?? "primary",
            requestBody: event,
        });
        return `Evento '${args.summary}' creado correctamente. Link: ${res.data.htmlLink}`;
    }
    catch (error) {
        return `Error creando evento: ${error.message}`;
    }
}
