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
        let startDate = new Date(startDateTime);
        let endDate = new Date(startDate.getTime() + 60 * 60000); // 1 hora por defecto

        // 🕵️ SMART SCHEDULING: Verificar conflictos
        const conflict = await this.checkConflict(startDate, endDate);
        if (conflict) {
            console.log(`⚠️ Conflict detected at ${format(startDate, 'HH:mm')}. Searching for next slot...`);
            // Buscar siguiente hueco libre (simple: mirar cada 15 min por las próximas 2 horas)
            let foundSlot = false;
            for (let i = 1; i <= 8; i++) { // 8 * 15m = 2 horas
                const nextStart = new Date(startDate.getTime() + 15 * 60000);
                const nextEnd = new Date(nextStart.getTime() + 60 * 60000);
                if (!(await this.checkConflict(nextStart, nextEnd))) {
                    startDate = nextStart;
                    endDate = nextEnd;
                    foundSlot = true;
                    break;
                }
                // Avanzar base para siguiente iteración
                startDate = nextStart;
            }

            if (!foundSlot) {
                return { reply: `❌ Está muy complicado tu día el ${data.fecha}. Intenté buscar hueco hasta 2 horas después de las ${data.hora} y todo está lleno.` };
            }
        }

        try {
            const event = await this.calendar.createEvent(
                title,
                description,
                startDate.toISOString(),
                endDate.toISOString()
            );

            const finalTime = format(startDate, 'HH:mm');
            let replyMsg = `✅ Listo. Agendado: "${title}" para el ${data.fecha} a las ${finalTime}.`;
            if (conflict) {
                replyMsg = `⚠️ A las ${data.hora} estabas ocupado, así que busqué el siguiente hueco libre.\n` + replyMsg;
            }
            replyMsg += `\n🔗 Link: ${event.htmlLink}`;

            return { reply: replyMsg };
        } catch (e) {
            console.error(e);
            return { reply: "❌ Hubo un error conectando con Google Calendar." };
        }
    }

    /**
     * Verifica si hay eventos que chocan en el rango dado
     */
    private async checkConflict(start: Date, end: Date): Promise<boolean> {
        try {
            // listEvents(timeMin, timeMax)
            const events = await this.calendar.listEvents(
                start.toISOString(),
                end.toISOString()
            );
            return events && events.length > 0;
        } catch (e) {
            console.error('Error checking conflict:', e);
            return false; // Asumir libre si falla para no bloquear
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
