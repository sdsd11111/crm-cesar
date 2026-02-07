import { db } from '@/lib/db';
import { contacts, events, interactions, tasks, contactChannels } from '@/lib/db/schema';
import { conversationStates, discoveryLeads, donnaChatMessages } from '../../db/schema';
import { messagingService } from '@/lib/messaging/MessagingService';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAIClient, getModelId } from '../../ai/client';
import { internalNotificationService } from '@/lib/messaging/services/InternalNotificationService';
import { customerMessagingService } from '@/lib/messaging/services/CustomerMessagingService';

const TIMEZONE = 'America/Guayaquil';

/**
 * Cortex Router v2.0: Intelligent Assistant Core
 * Implements "Senior Edition" logic with unified intents and same-day contextual memory.
 */
export class CortexRouterService {
    private promptTemplate: string = '';
    private calendarService: any;

    constructor() {
    }

    private getPromptTemplate(): string {
        if (!this.promptTemplate) {
            try {
                const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'cortex_router.md');
                this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
            } catch (error) {
                console.error('❌ Error loading Cortex Router prompt:', error);
                return 'Eres un asistente útil.'; // Fallback
            }
        }
        return this.promptTemplate;
    }

    private getCampaignPrompt(campaign: string): string {
        try {
            const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', `${campaign}.md`);
            return fs.readFileSync(promptPath, 'utf-8');
        } catch (error) {
            console.error(`❌ Error loading campaign prompt (${campaign}):`, error);
            return this.getPromptTemplate();
        }
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
    private async saveMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string, platform: 'telegram' | 'whatsapp' = 'whatsapp') {
        if (!chatId) return;
        try {
            await db.insert(donnaChatMessages).values({
                chatId,
                role,
                content,
                platform, // Use actual platform
                messageTimestamp: new Date(),
                metadata: { platform }
            });
        } catch (e) {
            console.error('[Memory] Error saving message (Ignored):', e);
        }
    }

    private async getRecentHistory(chatId: string, limit: number = 10): Promise<string> {
        if (!chatId) return '';

        // Relaxed Filter: Last 4 hours OR Same Day (Ecuador)
        const nowUTC = new Date();
        const nowZoned = toZonedTime(nowUTC, TIMEZONE);

        const startOfToday = new Date(nowZoned);
        try {
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
                        gte(donnaChatMessages.messageTimestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Only last 24h
                    )
                )
                .orderBy(desc(donnaChatMessages.messageTimestamp))
                .limit(limit);

            if (history.length === 0) return 'Sin historial reciente.';

            return history.reverse().map(msg => {
                const zonedMsgTime = toZonedTime(msg.messageTimestamp, TIMEZONE);
                return `[${format(zonedMsgTime, 'HH:mm')}] ${msg.role === 'user' ? 'User' : 'Donna'}: ${msg.content} `;
            }).join('\n');
        } catch (e) {
            console.warn('⚠️ DB History Error (Ignored):', e);
            return 'Sin historial (DB Error)';
        }
    }

    private async getContext(chatId?: string) {
        if (!chatId) return {};
        try {
            const state = await db.select().from(conversationStates).where(eq(conversationStates.key, chatId)).limit(1);
            if (state.length > 0) {
                try {
                    return JSON.parse(state[0].data as string);
                } catch (e) {
                    return {};
                }
            }
        } catch (dbError) {
            console.warn('⚠️ DB Context Error (Using empty context):', dbError);
            return {};
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
        platform?: 'telegram' | 'whatsapp'; // New explicit platform
        skipSave?: boolean; // Avoid redundant saves from webhooks
        onReply?: (text: string) => void;
        promptOverride?: string;
    }): Promise<any> {
        console.log(`🧠 Cortex Router 2.0 processing path: ${input.text.substring(0, 20)}...`);

        const platform = input.platform || (input.source === 'client' ? 'whatsapp' : 'telegram');
        const replyContext = { chatId: input.chatId, onReply: input.onReply, platform };

        if (input.chatId && !input.skipSave) {
            await this.saveMessage(input.chatId, 'user', input.text, platform);
        }

        const context = await this.getContext(input.chatId);
        let { contactId } = context;

        // Time Context
        const nowUTC = new Date();
        const nowZoned = toZonedTime(nowUTC, TIMEZONE);

        // 1. Prepare Prompt
        let prompt = input.promptOverride;
        if (!prompt) {
            if (input.source === 'client') {
                // HANDOVER CHECK: Check if bot is paused for this contact
                if (input.chatId) {
                    const contactResult = await db.select().from(contacts)
                        .innerJoin(contactChannels, eq(contacts.id, contactChannels.contactId))
                        .where(eq(contactChannels.identifier, input.chatId))
                        .limit(1);

                    if (contactResult.length > 0 && contactResult[0].contacts.botMode !== 'active') {
                        console.log(`🔇 Bot is ${contactResult[0].contacts.botMode} for this contact. Skipping.`);
                        return { status: 'paused', reason: contactResult[0].contacts.botMode };
                    }
                }

                // Determine if it's the Carnaval campaign (Default for clients for now)
                prompt = this.getCampaignPrompt('carnaval_2026');
            } else {
                prompt = this.getPromptTemplate();
            }
        }

        // Fetch Last Action Context
        const lastActionContext = context.lastAction || { intent: 'null', summary: 'null', timestamp: null };
        let timeDiffStr = 'Indefinido';
        let historyLimit = 10; // Rule of 10

        if (lastActionContext.timestamp) {
            const lastAt = new Date(lastActionContext.timestamp);
            const seconds = Math.floor((nowUTC.getTime() - lastAt.getTime()) / 1000);

            if (seconds < 60) timeDiffStr = `${seconds} segundos`;
            else if (seconds < 3600) timeDiffStr = `${Math.floor(seconds / 60)} minutos`;
            else timeDiffStr = `${Math.floor(seconds / 3600)} horas`;
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
            // Optimized AI Call (FAST model)
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');

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
                if (input.source === 'client') {
                    await customerMessagingService.sendMessage(input.chatId!, parsed.clarification_question, replyContext);
                } else {
                    await internalNotificationService.notifyCesar(parsed.clarification_question, replyContext);
                }
                return { status: 'needs_clarification', message: parsed.clarification_question };
            }

            // --- FRACTIONATED MESSAGING & VIDEO LOGIC ---
            if (input.source === 'client' && parsed.intent === 'CHAT') {
                const responseText = parsed.data?.response || parsed.reasoning || '';

                if (responseText.includes('[SEND_VIDEO_CARNAVAL]')) {
                    const parts = responseText.split('[SEND_VIDEO_CARNAVAL]');

                    // 1. Part One (Intro)
                    if (parts[0].trim()) {
                        await customerMessagingService.sendHumanizedMessage(input.chatId!, parts[0].trim(), replyContext);
                    }

                    // 2. The Video link (YouTube with thumbnail)
                    const videoUrl = 'https://youtube.com/shorts/RC1vVm24Ha0?si=kZzDb2xyYvVWFm1G';
                    await customerMessagingService.sendMessage(input.chatId!, videoUrl, replyContext);

                    // Small human-like delay
                    await new Promise(r => setTimeout(r, 1000));

                    // 3. Closing Text + Link (Split into 2 messages for preview)
                    if (parts[1] && parts[1].trim()) {
                        const closingText = parts[1].trim();
                        const urlMatch = closingText.match(/(https?:\/\/[^\s]+)/);

                        if (urlMatch) {
                            const url = urlMatch[0];
                            const textWithoutUrl = closingText.replace(url, '').trim();

                            if (textWithoutUrl) {
                                await customerMessagingService.sendHumanizedMessage(input.chatId!, textWithoutUrl, replyContext);
                            }
                            // Link alone for full preview
                            await customerMessagingService.sendMessage(input.chatId!, url, replyContext);
                        } else {
                            await customerMessagingService.sendHumanizedMessage(input.chatId!, closingText, replyContext);
                        }

                        // 🔥 CONVERSION NOTIFICATION TO CÉSAR
                        await internalNotificationService.notifyConversion(context.contact_name || 'Nuevo Lead', input.chatId || '');
                    }
                } else {
                    // Normal chat messages (send in fractions)
                    await customerMessagingService.sendHumanizedMessage(input.chatId!, responseText, replyContext);
                }

                // 4. --- HANDOVER LOGIC (Automatic Pause) ---
                if (parsed.handover === true || parsed.handover === 'true') {
                    console.log(`🤝 [HANDOVER] Automatic takeover triggered for ${input.chatId}. Pausing bot.`);
                    if (input.chatId) {
                        try {
                            await db.update(contacts)
                                .set({ botMode: 'paused' } as any)
                                .where(sql`id = (SELECT contact_id FROM contact_channels WHERE identifier = ${input.chatId} AND platform = 'whatsapp' LIMIT 1)`);

                            // Notify César via conversion notification
                            await internalNotificationService.notifyConversion(context.contact_name || 'Prospecto', input.chatId, "Toma de control automática (Preguntó precio/detalles)");
                        } catch (err) {
                            console.error('Handover Update Error:', err);
                        }
                    }
                }

                // Update context
                if (input.chatId) {
                    const actionSummary = `${parsed.intent}: ${responseText.substring(0, 30)}...`;
                    await this.saveContext(input.chatId, {
                        ...context,
                        lastAction: {
                            intent: parsed.intent,
                            summary: actionSummary,
                            timestamp: new Date().toISOString()
                        }
                    });
                }

                return { status: 'success', response: responseText };
            }

            // --- ROUTING (For Internal/Telegram commands) ---
            const rawName = parsed.data?.contact_name;
            const isQuery = parsed.intent.includes('QUERY');
            const isSchedule = parsed.intent.includes('SCHEDULE');

            if (rawName && !input.contactId && !isQuery) {
                const { entityResolver } = await import('./EntityResolverService');
                const { contactId: resolvedId } = await entityResolver.resolve(rawName);
                if (resolvedId) input.contactId = resolvedId;
            }

            await this.routeToTable(parsed, input.contactId, input.text, replyContext);

            return {
                status: 'success',
                intent: parsed.intent,
                subtype: parsed.subtype,
                data: parsed.data,
                reasoning: parsed.reasoning
            };

        } catch (error: any) {
            console.error('❌ Cortex Router Error:', error);
            return { status: 'error', error: error.message };
        }
    }

    private async routeToTable(parsed: any, contactId: string | undefined, originalText: string, context: { chatId?: string, onReply?: (text: string) => void, platform?: 'telegram' | 'whatsapp' }) {
        const { intent, subtype, data } = parsed;
        console.log(`📍 Action: ${intent} (${subtype})`);

        try {
            switch (intent) {
                case 'SCHEDULE':
                    if (!data.date || !data.time) {
                        await internalNotificationService.notifyCesar(`Dale, necesito fecha y hora para agendarlo. ¿Cuándo es?`, context);
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

                    await internalNotificationService.notifyCesar(
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

                    await db.insert(tasks).values({
                        title: data.title || 'Nueva tarea',
                        description: data.notes || originalText,
                        dueDate: finalDueDate,
                        status: 'todo',
                        priority: 'medium',
                        contactId: contactId || null,
                        assignedTo: 'César',
                    });

                    await internalNotificationService.notifyCesar(`✅ Tarea/Recordatorio guardado: **${data.title}**`, context);
                    break;

                case 'QUERY':
                    const dateInput = data.date;
                    let datesToQuery: string[] = [];
                    if (Array.isArray(dateInput)) datesToQuery = dateInput;
                    else if (typeof dateInput === 'string' && dateInput.trim()) datesToQuery = [dateInput];
                    else {
                        const nowUTC = new Date();
                        const nowZoned = toZonedTime(nowUTC, TIMEZONE);
                        datesToQuery = [format(nowZoned, "yyyy-MM-dd")];
                    }

                    for (const dateStr of datesToQuery) {
                        try {
                            const searchDate = fromZonedTime(`${dateStr} 12:00:00`, TIMEZONE);
                            const baseDate = toZonedTime(searchDate, TIMEZONE);
                            const startOfDay = new Date(baseDate); startOfDay.setHours(0, 0, 0, 0);
                            const endOfDay = new Date(baseDate); endOfDay.setHours(23, 59, 59, 999);

                            await internalNotificationService.notifyCesar(`📅 Revisando agenda para el **${format(baseDate, 'PPPP', { locale: es })}**...`, context);

                            const cal = await this.getCalendarService();
                            const agenda = await cal.listEvents(fromZonedTime(startOfDay, TIMEZONE).toISOString(), fromZonedTime(endOfDay, TIMEZONE).toISOString());

                            if (!agenda || agenda.length === 0) {
                                await internalNotificationService.notifyCesar(`✅ Todo libre para el ${format(baseDate, 'EEEE', { locale: es })}.`, context);
                            } else {
                                const list = agenda.map((e: any) => {
                                    const eventTime = e.start?.dateTime ? format(toZonedTime(new Date(e.start.dateTime), TIMEZONE), 'HH:mm') : 'Todo el día';
                                    return `• ${eventTime}: ${e.summary}`;
                                }).join('\n');
                                await internalNotificationService.notifyCesar(`📅 Eventos encontrados:\n\n${list}`, context);
                            }
                        } catch (err) { console.error(err); }
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
                        await internalNotificationService.notifyCesar(`✅ Contacto **${data.contact_name}** registrado.`, context);
                    }
                    break;

                case 'SEND':
                    if (contactId && data.notes) {
                        const [c] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
                        if (c?.phone) {
                            await customerMessagingService.sendMessage(c.id, data.notes, { type: 'manual_via_donna' });
                            await internalNotificationService.notifyCesar(`📨 WhatsApp enviado a ${c.contactName}.`, context);
                        }
                    }
                    break;

                default:
                    if (context.platform === 'telegram') {
                        await internalNotificationService.notifyCesar(`Entiendo, lo proceso enseguida.`, context);
                    } else {
                        await customerMessagingService.sendMessage(context.chatId!, `Entiendo, lo proceso enseguida.`, context);
                    }
            }
        } catch (error) {
            console.error('❌ Error in routeToTable:', error);
            throw error;
        }
    }

    // --- DELEGATED TO CustomerMessagingService ---

    private async extractDiscoveryLead(chatId: string, text: string, platform: string) {
        if (!text || text.length < 5) return;
        try {
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');
            const extractionPrompt = `Extract Lead info from: "${text}". Return JSON with {found:bool, name, business, city, email}.`;
            const completion = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'user', content: extractionPrompt }],
                temperature: 0,
                response_format: { type: 'json_object' }
            });
            const result = JSON.parse(completion.choices[0].message.content || '{}');

            if (result.found) {
                const existing = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, chatId)).limit(1);
                if (existing.length > 0) {
                    await db.update(discoveryLeads).set({
                        nombreComercial: result.business || existing[0].nombreComercial,
                        personaContacto: result.name || existing[0].personaContacto,
                        canton: result.city || existing[0].canton,
                        correoElectronico: result.email || existing[0].correoElectronico,
                        updatedAt: new Date()
                    }).where(eq(discoveryLeads.id, existing[0].id));
                } else {
                    await db.insert(discoveryLeads).values({
                        telefonoPrincipal: chatId,
                        nombreComercial: result.business || 'Sin Nombre',
                        personaContacto: result.name,
                        canton: result.city,
                        correoElectronico: result.email,
                        sistemaOrigen: 'auto_discovery_chat',
                        status: 'pending'
                    });
                }
            }
        } catch (e) {
            console.error('Lead Extraction Failed:', e);
        }
    }
}

export const cortexRouter = new CortexRouterService();
