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
        // FIX: Usar el ID explícito del calendario del usuario
        // 'primary' consulta el calendario de la Service Account (que está vacío)
        this.calendar = new GoogleCalendarService('objetivo.cesar@gmail.com');
        this.promptsDir = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'agenda');
    }

    /**
     * Procesa un mensaje de texto para gestión de agenda.
     */
    async processInput(text: string, chatId?: string): Promise<{ reply: string; actionTaken?: string }> {
        console.log('📅 [AgendaManager] Procesando input:', { text, chatId });

        // 1. Clasificación (Router)
        const intent = await this.classifyIntent(text);
        console.log(`📅 [AgendaManager] Intent clasificado: "${intent}"`);

        if (intent === 'crear') {
            console.log('📅 [AgendaManager] Ejecutando: handleCreateEvent');
            return await this.handleCreateEvent(text);
        } else if (intent === 'agenda') {
            console.log('📅 [AgendaManager] Ejecutando: handleQueryAgenda');
            return await this.handleQueryAgenda(text);
        } else if (intent === 'borrar') {
            console.log('📅 [AgendaManager] Intent: borrar (no implementado por seguridad)');
            return { reply: "Para borrar eventos, por favor usa Google Calendar directamente por seguridad." };
        }

        console.log('📅 [AgendaManager] Intent desconocido, retornando mensaje de ayuda');
        return { reply: "No estoy segura si querías agendar algo. Intenta decir: 'Agenda cita mañana a las 5'." };
    }

    /**
     * Clasifica la intención usando el prompt de una sola palabra
     */
    private async classifyIntent(text: string): Promise<string> {
        console.log('🧭 [AgendaManager] Clasificando intención...');
        const promptPath = path.join(this.promptsDir, 'router_classifier.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');
        promptTpl = promptTpl.replace('{{INPUT}}', text);

        console.log('🧭 [AgendaManager] Prompt router preparado');
        const ai = getAIClient('STANDARD'); // GPT-4o (Rápido)
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            max_tokens: 10
        });

        const intent = response.choices[0]?.message?.content?.trim().toLowerCase() || 'desconocido';
        console.log('🧭 [AgendaManager] Clasificación completada:', intent);
        return intent;
    }

    /**
     * Maneja la creación de eventos (Extracción JSON)
     */
    private async handleCreateEvent(text: string): Promise<{ reply: string }> {
        console.log('➕ [AgendaManager] Iniciando creación de evento');
        const promptPath = path.join(this.promptsDir, 'create_event.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');

        const now = new Date();
        promptTpl = promptTpl
            .replace('{{INPUT}}', text)
            .replace('{{CURRENT_DATE}}', format(now, 'yyyy-MM-dd'))
            .replace('{{CURRENT_DAY_NAME}}', format(now, 'EEEE', { locale: es }))
            .replace('{{CURRENT_TIME}}', format(now, 'HH:mm'));

        console.log('➕ [AgendaManager] Extrayendo datos del evento con AI...');
        const ai = getAIClient('STANDARD');
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0]?.message?.content || '{}');
        console.log('➕ [AgendaManager] Datos extraídos:', data);

        // 1. Manejo de Status "incomplete" (Donna pregunta)
        if (data.status === 'incomplete') {
            return { reply: data.pregunta || "Me falta información para agendar. ¿Podrías confirmarme fecha y hora?" };
        }

        // 2. Extracción de datos "ready"
        const evento = data.evento || {};
        const fecha = evento.fecha;
        const hora = evento.hora;

        // Fallback de seguridad por si el JSON viene mal formado aunque diga "ready"
        if (!fecha || !hora) {
            return { reply: "Entiendo que quieres agendar, pero algo no me quedó claro. ¿Para qué día y hora?" };
        }

        // Crear evento real
        const title = evento.titulo || `Reunión con ${evento.para || 'Alguien'}`;
        const description = `Agendado por Donna.\nPara: ${evento.para || 'N/A'}\nLugar: ${evento.lugar || 'No especificado'}\nContexto original: "${text}"`;

        // Construir Start/End Time
        const startDateTime = `${fecha}T${hora}:00-05:00`; // Asumiendo GMT-5
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
                return { reply: `❌ Está muy complicado tu día el ${fecha}. Intenté buscar hueco hasta 2 horas después de las ${hora} y todo está lleno.` };
            }
        }

        try {
            const googleEvent = await this.calendar.createEvent(
                title,
                description,
                startDate.toISOString(),
                endDate.toISOString()
            );

            const finalTime = format(startDate, 'HH:mm');
            let replyMsg = `✅ Listo. Agendado: "${title}" para el ${fecha} a las ${finalTime}.`;
            if (conflict) {
                replyMsg = `⚠️ A las ${hora} estabas ocupado, así que busqué el siguiente hueco libre.\n` + replyMsg;
            }
            if (evento.lugar) {
                replyMsg += `\n📍 Lugar: ${evento.lugar}`;
            }
            replyMsg += `\n🔗 Link: ${googleEvent.htmlLink}`;

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
        console.log('📅 [AgendaManager] Iniciando consulta de agenda');
        const promptPath = path.join(this.promptsDir, 'query_agenda.md');
        let promptTpl = fs.readFileSync(promptPath, 'utf-8');

        const now = new Date();
        promptTpl = promptTpl
            .replace('{{INPUT}}', text)
            .replace('{{CURRENT_DATE}}', format(now, 'yyyy-MM-dd'))
            .replace('{{CURRENT_DAY_NAME}}', format(now, 'EEEE', { locale: es }));

        console.log('📅 [AgendaManager] Extrayendo fecha de consulta con AI...');
        const ai = getAIClient('STANDARD');
        const response = await ai.chat.completions.create({
            model: getModelId('STANDARD'),
            messages: [{ role: 'user', content: promptTpl }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0]?.message?.content || '{}');
        console.log('📅 [AgendaManager] Datos extraídos:', data);

        let searchDate = now;
        if (data.fecha) {
            // FIX: Parsear "YYYY-MM-DD" manualmente para asegurar interpretación local
            // new Date("YYYY-MM-DD") interpreta como UTC, causando desfase de zona horaria
            const [year, month, day] = data.fecha.split('-').map(Number);
            searchDate = new Date(year, month - 1, day); // month es 0-indexed
        }
        console.log('📅 [AgendaManager] Fecha de búsqueda (Local):', searchDate.toLocaleString());

        // FIX: Crear nuevas instancias de Date para evitar mutación
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        console.log('📅 [AgendaManager] Buscando eventos entre:', {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
        });

        // Listar eventos
        const events = await this.calendar.listEvents(
            startOfDay.toISOString(),
            endOfDay.toISOString()
        );

        console.log('📅 [AgendaManager] Eventos encontrados:', events?.length || 0);

        if (!events || events.length === 0) {
            const formattedDate = data.fecha || 'hoy';
            console.log('📅 [AgendaManager] Agenda libre para:', formattedDate);
            return { reply: `📅 Tienes la agenda libre para el ${formattedDate}.` };
        }

        // Safe check for e.start
        const summary = events.map((e: any) => {
            const time = e.start?.dateTime ? format(new Date(e.start.dateTime), 'HH:mm') : 'Todo el día';
            return `- ${time}: ${e.summary}`;
        }).join('\n');

        const formattedDate = data.fecha || 'hoy';
        console.log('📅 [AgendaManager] Retornando agenda con', events.length, 'eventos');
        return { reply: `📅 Agenda para ${formattedDate}:\n${summary}` };
    }
}
