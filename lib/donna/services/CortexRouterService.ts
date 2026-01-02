import { db } from '@/lib/db';
import { conversationStates, contacts, interactions, tasks, commitments, events, reminders, donnaChatMessages } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAIClient, getModelId } from '@/lib/ai/client';

const TIMEZONE = 'America/Guayaquil';

/**
 * Cortex Router v2.0: Intelligent Assistant Core
 * Implements "Senior Edition" logic with unified intents and same-day contextual memory.
 */
export class CortexRouterService {
    private promptTemplate: string;
    private calendarService: any;

    constructor() {
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'cortex_router.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    }

    private async getCalendarService() {
        if (!this.calendarService) {
            const { GoogleCalendarService } = await import('@/lib/google/CalendarService');
            // Explicitly use the user's calendar ID
            this.calendarService = new GoogleCalendarService('objetivo.cesar@gmail.com');
        }
        return this.calendarService;
    }

    // --- MEMORY SYSTEM ---
    private async saveMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string) {
        if (!chatId) return;
        await db.insert(donnaChatMessages).values({
            chatId,
            role,
            content,
            platform: 'telegram',
            messageTimestamp: new Date()
        });
    }

    private async getRecentHistory(chatId: string, limit: number = 10): Promise<string> {
        if (!chatId) return '';

        // Relaxed Filter: Last 4 hours OR Same Day (Ecuador)
        const nowUTC = new Date();
        const nowZoned = toZonedTime(nowUTC, TIMEZONE);

        const startOfToday = new Date(nowZoned);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayUTC = fromZonedTime(startOfToday, TIMEZONE);

        const fourHoursAgoUTC = new Date(nowUTC.getTime() - 4 * 60 * 60000);

        // We use the EARLIER of 4 hours ago or start of today to ensure continuity
        const effectiveStartUTC = fourHoursAgoUTC < startOfTodayUTC ? fourHoursAgoUTC : startOfTodayUTC;

        const history = await db.select()
            .from(donnaChatMessages)
            .where(
                and(
                    eq(donnaChatMessages.chatId, chatId),
                    gte(donnaChatMessages.messageTimestamp, effectiveStartUTC)
                )
            )
            .orderBy(desc(donnaChatMessages.messageTimestamp))
            .limit(limit);

        if (history.length === 0) return 'Sin historial reciente.';

        return history.reverse().map(msg => {
            const zonedMsgTime = toZonedTime(msg.messageTimestamp, TIMEZONE);
            return `[${format(zonedMsgTime, 'HH:mm')}] ${msg.role === 'user' ? 'User' : 'Donna'}: ${msg.content}`;
        }).join('\n');
    }

    private async getContext(chatId?: string) {
        if (!chatId) return {};
        const state = await db.select().from(conversationStates).where(eq(conversationStates.key, chatId)).limit(1);
        if (state.length > 0) {
            try {
                return JSON.parse(state[0].data as string);
            } catch (e) {
                console.error('Error parsing context:', e);
            }
        }
        return {};
    }

    private async saveContext(chatId: string | undefined, data: any) {
        if (!chatId) return;
        const existing = await db.select().from(conversationStates).where(eq(conversationStates.key, chatId)).limit(1);
        const jsonData = JSON.stringify(data);

        if (existing.length > 0) {
            await db.update(conversationStates).set({ data: jsonData, updatedAt: new Date() }).where(eq(conversationStates.key, chatId));
        } else {
            await db.insert(conversationStates).values({ key: chatId, data: jsonData });
        }
    }

    /**
     * Main Entry Point
     */
    async processInput(input: {
        text: string;
        source: 'cesar' | 'client';
        contactId?: string;
        chatId?: string;
        onReply?: (text: string) => void;
        promptOverride?: string;
    }): Promise<any> {
        console.log(`🧠 Cortex Router 2.0 processing path: ${input.text.substring(0, 20)}...`);

        const replyContext = { chatId: input.chatId, onReply: input.onReply };

        if (input.chatId) {
            await this.saveMessage(input.chatId, 'user', input.text);
        }

        const context = await this.getContext(input.chatId);
        let { contactId } = context;

        // Time Context
        const nowUTC = new Date();
        const nowZoned = toZonedTime(nowUTC, TIMEZONE);

        // 1. Prepare Prompt
        let prompt = input.promptOverride || this.promptTemplate;

        // Fetch Last Action Context
        const lastActionContext = context.lastAction || { intent: 'null', summary: 'null', timestamp: null };
        let timeDiffStr = 'Indefinido';
        let historyLimit = 5;

        if (lastActionContext.timestamp) {
            const lastAt = new Date(lastActionContext.timestamp);
            const seconds = Math.floor((nowUTC.getTime() - lastAt.getTime()) / 1000);

            if (seconds < 60) timeDiffStr = `${seconds} segundos`;
            else if (seconds < 3600) timeDiffStr = `${Math.floor(seconds / 60)} minutos`;
            else timeDiffStr = `${Math.floor(seconds / 3600)} horas`;

            // Always use 10 messages if possible to follow "hasta 10" rule
            historyLimit = 10;
        }

        // Inject Conversational Memory Placeholders
        prompt = prompt.replace('{{LAST_ACTION}}', lastActionContext.summary || 'null');
        prompt = prompt.replace('{{LAST_ACTION_TIMESTAMP}}', lastActionContext.timestamp ? format(toZonedTime(new Date(lastActionContext.timestamp), TIMEZONE), "yyyy-MM-dd HH:mm:ss") : 'null');
        prompt = prompt.replace('{{TIME_SINCE_LAST_ACTION}}', timeDiffStr);

        // Inject History
        const history = await this.getRecentHistory(input.chatId || 'testing', historyLimit);
        prompt = prompt.replace('{{HISTORY}}', history);

        // Inject Time (Zoned to America/Guayaquil)
        prompt = prompt.replace('{{CURRENT_DATE}}', format(nowZoned, "yyyy-MM-dd"));
        prompt = prompt.replace('{{CURRENT_DAY_NAME}}', format(nowZoned, "EEEE", { locale: es }));
        prompt = prompt.replace('{{CURRENT_TIME}}', format(nowZoned, "HH:mm"));

        // Inject Input
        prompt = prompt.replace('{{INPUT}}', input.text);

        try {
            const aiClient = getAIClient('STANDARD');
            const modelId = getModelId('STANDARD');

            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
            });

            const content = response.choices[0]?.message?.content || "{}";
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonStartIndex = cleaned.indexOf('{');
            const jsonEndIndex = cleaned.lastIndexOf('}');
            const finalJsonStr = (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) ? cleaned.substring(jsonStartIndex, jsonEndIndex + 1) : cleaned;

            const parsed = JSON.parse(finalJsonStr);

            if (parsed.reasoning) {
                console.log(`🧠 [Reasoning] ${parsed.reasoning}`);
            }

            // --- CLARIFICATION FLOW ---
            if (parsed.needs_clarification && parsed.clarification_question) {
                await this.sendTelegramMessage(parsed.clarification_question, replyContext);
                return { status: 'needs_clarification', message: parsed.clarification_question };
            }

            // --- ENTITY RESOLUTION ---
            const rawName = parsed.data?.contact_name;
            const isQuery = parsed.intent.includes('QUERY');
            const isSchedule = parsed.intent.includes('SCHEDULE');

            if (rawName && !input.contactId && !isQuery) {
                const { entityResolver } = await import('./EntityResolverService');
                const { contactId: resolvedId } = await entityResolver.resolve(
                    rawName,
                    (msg: string) => {
                        // Only send clarification if NOT a schedule or if explicitly needed
                        if (!isSchedule) this.sendTelegramMessage(msg, replyContext);
                    }
                );

                if (resolvedId) {
                    input.contactId = resolvedId;
                } else if (!isSchedule) {
                    // Critical for other intents: contact resolution is mandatory
                    console.log(`⚠️ Resolution pending for "${rawName}". Stopping route.`);
                    return { status: 'pending_resolution', entity: rawName };
                } else {
                    // For SCHEDULE: we proceed with the rawName if no match found
                    console.log(`ℹ️ No contact found for "${rawName}", proceeding with raw name for Agenda.`);
                }
            }

            // --- ROUTING ---
            await this.routeToTable(parsed, input.contactId, input.text, replyContext);

            // Update Last Action in Context
            if (input.chatId && !parsed.needs_clarification) {
                const actionSummary = `${parsed.intent}${parsed.subtype ? `_${parsed.subtype}` : ''}: ${parsed.data?.title || input.text.substring(0, 30)}`;
                await this.saveContext(input.chatId, {
                    ...context,
                    lastAction: {
                        intent: parsed.intent,
                        summary: actionSummary,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            return {
                status: 'success',
                intent: parsed.intent,
                subtype: parsed.subtype,
                data: parsed.data,
                reasoning: parsed.reasoning
            };

        } catch (error: any) {
            console.error('❌ Cortex Router Error:', error);
            await this.sendTelegramMessage(`❌ Error: ${error.message}`, replyContext);
            return { status: 'error', error };
        }
    }

    private async routeToTable(parsed: any, contactId: string | undefined, originalText: string, context: { chatId?: string, onReply?: (text: string) => void }) {
        const { intent, subtype, data } = parsed;
        console.log(`📍 Action: ${intent} (${subtype})`);

        try {
            switch (intent) {
                case 'SCHEDULE':
                    if (!data.date || !data.time) {
                        // This shouldn't normally happen if needs_clarification is true, but for safety:
                        await this.sendTelegramMessage(`Dale, necesito fecha y hora para agendarlo. ¿Cuándo es?`, context);
                        return;
                    }

                    const dateTimeStr = `${data.date} ${data.time}`;
                    const startDate = fromZonedTime(dateTimeStr, TIMEZONE);
                    const duration = data.duration_minutes || 60;
                    const endDate = new Date(startDate.getTime() + duration * 60000);

                    const calendar = await this.getCalendarService();
                    const event = await calendar.createEvent(
                        data.title || 'Reunión Agendada',
                        data.notes || `Agendado por Donna. Ref: ${originalText}`,
                        startDate.toISOString(),
                        endDate.toISOString()
                    );

                    await db.insert(events).values({
                        title: data.title || 'Reunión Agendada',
                        description: `Google Link: ${event.htmlLink}`,
                        startTime: startDate,
                        endTime: endDate,
                        contactId: contactId || null,
                        status: 'scheduled',
                        location: data.location || event.hangoutLink || 'Google Meet'
                    });

                    await this.sendTelegramMessage(
                        `🗓️ **Agendado con éxito:**\n` +
                        `📌 ${data.title}\n` +
                        `⏰ ${format(startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}\n` +
                        `🔗 [Link al evento](${event.htmlLink})`,
                        context
                    );
                    break;

                case 'TASK':
                    let finalDueDate: Date | null = null;
                    if (data.date) {
                        const timeStr = data.time || "12:00";
                        try {
                            finalDueDate = fromZonedTime(`${data.date} ${timeStr}`, TIMEZONE);
                        } catch (e) {
                            finalDueDate = new Date(`${data.date}T12:00:00`);
                        }
                    }

                    const newTask = await db.insert(tasks).values({
                        title: data.title || 'Nueva tarea',
                        description: data.notes || originalText,
                        dueDate: finalDueDate,
                        status: 'todo',
                        priority: 'medium',
                        contactId: contactId || null,
                        assignedTo: 'César',
                    }).returning();

                    if (subtype === 'reminder' && data.date) {
                        // Implement simple reminder creation logic
                        const offsets = data.reminder_minutes || [15];
                        for (const offset of offsets) {
                            // Simplified logic: set reminder for the target date minus offset
                            // Real production would need a more complex time parser
                        }
                    }

                    await this.sendTelegramMessage(`✅ Tarea/Recordatorio guardado: **${data.title}**`, context);
                    break;

                case 'QUERY':
                    // Critical: Resolve dates into an array (even if it's just one)
                    const dateInput = data.date;
                    let datesToQuery: string[] = [];

                    if (Array.isArray(dateInput)) {
                        datesToQuery = dateInput;
                    } else if (typeof dateInput === 'string' && dateInput.trim()) {
                        datesToQuery = [dateInput];
                    } else {
                        // Default to today if null
                        const nowUTC = new Date();
                        const nowZoned = toZonedTime(nowUTC, TIMEZONE);
                        datesToQuery = [format(nowZoned, "yyyy-MM-dd")];
                    }

                    for (const dateStr of datesToQuery) {
                        try {
                            const searchDate = fromZonedTime(`${dateStr} 12:00:00`, TIMEZONE);

                            // Create date range in Ecuador Time
                            const baseDate = toZonedTime(searchDate, TIMEZONE);

                            const startOfDay = new Date(baseDate);
                            startOfDay.setHours(0, 0, 0, 0);
                            const startOfDayUTC = fromZonedTime(startOfDay, TIMEZONE);

                            const endOfDay = new Date(baseDate);
                            endOfDay.setHours(23, 59, 59, 999);
                            const endOfDayUTC = fromZonedTime(endOfDay, TIMEZONE);

                            await this.sendTelegramMessage(`📅 Revisando agenda para el **${format(baseDate, 'PPPP', { locale: es })}**...`, context);

                            const cal = await this.getCalendarService();
                            const agenda = await cal.listEvents(startOfDayUTC.toISOString(), endOfDayUTC.toISOString());

                            if (!agenda || agenda.length === 0) {
                                await this.sendTelegramMessage(`✅ Todo libre para el ${format(baseDate, 'EEEE', { locale: es })}.`, context);
                            } else {
                                const list = agenda.map((e: any) => {
                                    const eventDate = e.start?.dateTime ? new Date(e.start.dateTime) : new Date(e.start.date);
                                    const zonedEventTime = toZonedTime(eventDate, TIMEZONE);
                                    const timeLabel = e.start?.dateTime ? format(zonedEventTime, 'HH:mm') : 'Todo el día';
                                    return `• ${timeLabel}: ${e.summary}`;
                                }).join('\n');
                                await this.sendTelegramMessage(`📅 Eventos encontrados el ${format(baseDate, 'EEEE', { locale: es })}:\n\n${list}`, context);
                            }
                        } catch (err) {
                            console.error(`Error querying agenda for date ${dateStr}:`, err);
                        }
                    }
                    break;

                case 'CONTACT':
                    if (subtype === 'create') {
                        await db.insert(contacts).values({
                            contactName: data.contact_name || 'Nuevo Contacto',
                            businessName: data.business_name || null,
                            phone: data.phone || null,
                            email: data.email || null,
                            source: 'donna_telegram',
                        });
                        await this.sendTelegramMessage(`✅ Contacto **${data.contact_name}** registrado.`, context);
                    } else if (subtype === 'note') {
                        if (contactId) {
                            await db.insert(interactions).values({
                                contactId,
                                type: 'note',
                                content: data.notes || originalText,
                            });
                            await this.sendTelegramMessage(`🧠 Nota guardada para el contacto.`, context);
                        }
                    }
                    break;

                case 'SEND':
                    if (contactId && data.notes) {
                        const [c] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
                        if (c?.phone) {
                            const { whatsappService } = await import('@/lib/whatsapp/WhatsAppService');
                            await whatsappService.sendMessage(c.phone, data.notes, { type: 'manual_via_donna' });
                            await this.sendTelegramMessage(`📨 WhatsApp enviado a ${c.contactName}.`, context);
                        }
                    }
                    break;

                case 'CANCEL':
                    await this.sendTelegramMessage(`🔕 Cancelado.`, context);
                    break;

                case 'STRATEGIC':
                    await db.insert(interactions).values({
                        type: 'note',
                        content: `[ESTRATÉGICO] ${data.title}: ${data.notes || originalText}`,
                    });
                    await this.sendTelegramMessage(`💡 Insight estratégico guardado.`, context);
                    break;

                default:
                    await this.sendTelegramMessage(`Entiendo, lo proceso enseguida.`, context);
            }
        } catch (error) {
            console.error('❌ Error in routeToTable:', error);
            throw error;
        }
    }

    private async sendTelegramMessage(message: string, context: { chatId?: string, onReply?: (text: string) => void }) {
        const { chatId, onReply } = context;
        if (onReply) onReply(message);

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

        if (targetChatId) {
            await this.saveMessage(targetChatId, 'assistant', message);
            if (botToken) {
                fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: targetChatId, text: message, parse_mode: 'Markdown' })
                }).catch(e => console.error('Telegram API Error:', e));
            }
        }
    }
}

export const cortexRouter = new CortexRouterService();
