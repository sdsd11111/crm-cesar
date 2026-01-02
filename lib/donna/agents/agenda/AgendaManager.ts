import { getAIClient, getModelId } from '@/lib/ai/client';
import { GoogleCalendarService } from '@/lib/google/CalendarService';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaContext {
    intent?: 'crear' | 'borrar' | 'agenda' | 'desconocido';
    data?: any;
    step?: 'routing' | 'details_needed' | 'confirmation';
}

/**
 * AgendaManager: Módulo de Secretaria (Aislado)
 * Maneja exclusivamente la gestión de calendario y citas.
 */
export class AgendaManager {
    private calendar: GoogleCalendarService;
    private promptsDir: string;

    constructor() {
        this.calendar = new GoogleCalendarService();
        this.promptsDir = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'agenda');
    }

    /**
     * Procesa un mensaje de texto para gestión de agenda.
     */
    async processInput(text: string, chatId?: string): Promise<{ reply: string; actionTaken?: string }> {
        // 1. Clasificación (Router)
        const intent = await this.classifyIntent(text);
        console.log(`📅 Agenda Intent: ${intent}`);

        if (intent === 'crear') {
            return await this.handleCreateEvent(text);
        } else if (intent === 'agenda') {
            return await this.handleQueryAgenda(text);
        } else if (intent === 'borrar') {
            return { reply: "Para borrar eventos, por favor usa Google Calendar directamente por seguridad." };
        }

        return { reply: "No estoy segura si querías agendar algo. Intenta decir: 'Agenda cita mañana a las 5'." };
    }

    /**
     * Clasifica la intención usando el prompt de una sola palabra
     */
    private async classifyIntent(text: string): Promise<string> {
        const promptPath = path.join(this.promptsDir, 'router_classifier.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');
        promptTpl = promptTpl.replace('{{INPUT}}', text);

        const ai = getAIClient('STANDARD'); // GPT-4o (Rápido)
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            max_tokens: 10
        });

        return response.choices[0]?.message?.content?.trim().toLowerCase() || 'desconocido';
    }

    /**
     * Maneja la creación de eventos (Extracción JSON)
     */
    private async handleCreateEvent(text: string): Promise<{ reply: string }> {
        const promptPath = path.join(this.promptsDir, 'create_event.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');

        const now = new Date();
        promptTpl = promptTpl
            .replace('{{INPUT}}', text)
            .replace('{{CURRENT_DATE}}', format(now, 'yyyy-MM-dd'))
            .replace('{{CURRENT_DAY_NAME}}', format(now, 'EEEE', { locale: es }));

        const ai = getAIClient('STANDARD');
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0]?.message?.content || '{}');
        console.log('📅 Extracted Data:', data);

        // Validación de datos faltantes (La ventaja sobre Make)
        if (!data.fecha) return { reply: "Entiendo que quieres agendar, pero ¿para qué día?" };
        if (!data.hora) return { reply: `Vale, para el ${data.fecha}. ¿A qué hora te agendo?` };

        // Crear evento real
        const title = data.mensaje || `Reunión con ${data.para || 'Cliente'}`;
        const description = `Agendado por Donna.\nPara: ${data.para || 'N/A'}\nContexto original: "${text}"`;

        // Construir Start/End Time
        const startDateTime = `${data.fecha}T${data.hora}:00-05:00`; // Asumiendo GMT-5
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + 60 * 60000); // 1 hora por defecto

        try {
            const event = await this.calendar.createEvent(
                title,
                description,
                startDate.toISOString(),
                endDate.toISOString()
            );
            return { reply: `✅ Listo. Agendado: "${title}" para el ${data.fecha} a las ${data.hora}.\n🔗 Link: ${event.htmlLink}` };
        } catch (e) {
            console.error(e);
            return { reply: "❌ Hubo un error conectando con Google Calendar." };
        }
    }

    /**
     * Maneja la consulta de agenda
     */
    private async handleQueryAgenda(text: string): Promise<{ reply: string }> {
        const promptPath = path.join(this.promptsDir, 'query_agenda.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');

        const now = new Date();
        promptTpl = promptTpl
            .replace('{{INPUT}}', text)
            .replace('{{CURRENT_DATE}}', format(now, 'yyyy-MM-dd'))
            .replace('{{CURRENT_DAY_NAME}}', format(now, 'EEEE', { locale: es }));

        const ai = getAIClient('STANDARD');
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0]?.message?.content || '{}');
        const searchDate = data.fecha ? new Date(data.fecha) : now;

        // Listar eventos
        const events = await this.calendar.listEvents(
            new Date(searchDate.setHours(0, 0, 0, 0)).toISOString(),
            new Date(searchDate.setHours(23, 59, 59, 999)).toISOString()
        );

        if (!events || events.length === 0) return { reply: `📅 Tienes la agenda libre para el ${data.fecha || 'hoy'}.` };

        // Safe check for e.start
        const summary = events.map((e: any) => {
            const time = e.start?.dateTime ? format(new Date(e.start.dateTime), 'HH:mm') : 'Todo el día';
            return `- ${time}: ${e.summary}`;
        }).join('\n');

        return { reply: `📅 Agenda para ${data.fecha || 'hoy'}:\n${summary}` };
    }
}
