import { db } from '@/lib/db';
import { contacts, events, interactions, tasks, contactChannels, products, leads, quotations } from '@/lib/db/schema';
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
import { alejandraService } from './AlejandraService';
import { transcriptionService } from '../../ai/TranscriptionService';
import { whatsappService, WhatsAppMedia } from '@/lib/whatsapp/WhatsAppService';
import { pdfDocumentService } from './PdfDocumentService';

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

    private getExpertPrompt(fileName: string): string {
        try {
            const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', fileName);
            return fs.readFileSync(promptPath, 'utf-8');
        } catch (error) {
            console.error(`❌ Error loading expert prompt (${fileName}):`, error);
            return this.getPromptTemplate();
        }
    }

    private getCampaignPrompt(campaign: string): string {
        return this.getExpertPrompt(`${campaign}.md`);
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
        const replyContext = {
            chatId: input.chatId,
            onReply: input.onReply,
            platform,
            source: 'donna'
        };

        const processedText = input.text;

        // Detect Audio Transcription marker
        if (processedText.includes('[Audio Transcrito]:')) {
            console.log(`🎤 Transcription marker found for ${input.chatId}. Audio processing already completed by worker.`);
        }

        if (!input.skipSave) {
            await this.saveMessage(input.chatId || 'system', input.source === 'cesar' ? 'user' : 'user', processedText, platform);
        }

        const context = await this.getContext(input.chatId);
        let { contactId } = context;

        // Ensure we use the best available information
        if (input.contactId) {
            contactId = input.contactId;
            context.contact_id = input.contactId;
        }

        // Time Context
        const nowUTC = new Date();
        const nowZoned = toZonedTime(nowUTC, TIMEZONE);

        // 1. Fetch History & Entity Memory (Hybrid Layer)
        const historyLimit = 20;
        const history = await this.getRecentHistory(input.chatId || 'testing', historyLimit);

        // Fetch Detailed Contact Profile (Entity Memory)
        let entityDigest = 'No hay perfil estratégico registrado para este contacto.';
        if (contactId) {
            try {
                const [contactRecord] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
                if (contactRecord) {
                    entityDigest = `
### REPORTE ESTRATÉGICO (MEMORIA DE ENTIDAD)
- Dolores (Pains): ${contactRecord.pains || 'N/A'}
- Objetivos: ${contactRecord.goals || 'N/A'}
- Objeciones: ${contactRecord.objections || 'N/A'}
- Notas: ${contactRecord.notes || 'N/A'}
`.trim();
                }
            } catch (err) {
                console.error('❌ Error fetching Entity Memory:', err);
            }
        }

        // 2. ALEJANDRA: IDENTITY & INTENT CLASSIFICATION + TRANSLATION
        const digest = await alejandraService.identifyAndTranslate(processedText, {
            chatId: input.chatId || 'unknown',
            contactName: context.contact_name,
            businessName: context.business_name,
            source: input.source,
            history: history // Pass history to Alejandra for context
        });

        const { role, intent, digest: internalDigest, needs_clarification, clarification_question, subtype, data: extractedData } = digest;

        // If high ambiguity, Alejandra asks for clarification directly
        if (needs_clarification && clarification_question) {
            console.log(`🙋‍♀️ [Alejandra] Asking for clarification: ${clarification_question}`);
            if (input.source === 'client' && input.chatId) {
                await customerMessagingService.sendHumanizedMessage(input.chatId, clarification_question, replyContext);
            } else if (input.source === 'cesar') {
                await internalNotificationService.notifyCesar(clarification_question, replyContext);
            }
            return { status: 'needs_clarification', response: clarification_question };
        }

        console.log(`🧭 [Alejandra] Role: ${role} | Intent: ${intent} | Digest: "${internalDigest.substring(0, 30)}..."`);

        // 3. Expert Selection Logic
        let promptFile = 'ventas_expert.md'; // Default for public

        // A. Priority: Identity-based persona
        switch (role) {
            case 'cesar':
                promptFile = 'cortex_router.md';
                break;
            case 'abel':
                promptFile = 'abel_expert.md';
                break;
            case 'vendedores':
                promptFile = 'vendedor_expert.md';
                break;
            case 'ventas':
                promptFile = 'ventas_expert.md';
                break;
        }

        // B. Intent Override for Specialized Tasks (Only for authorized roles)
        if (intent !== 'CHAT' && intent !== 'KNOWLEDGE') {
            if (role === 'cesar' || role === 'abel' || role === 'ventas') {
                if (subtype === 'crear' || intent === 'SCHEDULE') promptFile = 'agenda/create_event.md';
                else if (subtype === 'agenda' || intent === 'QUERY_AGENDA') promptFile = 'agenda/query_agenda.md';
                else if (subtype === 'borrar') promptFile = 'agenda/create_event.md'; // Assuming 'borrar' also uses create_event for now, or needs a specific prompt
                else if (intent === 'COTIZACION') {
                    console.log(`📑 [Router] Intent is COTIZACION. Keeping base router to extract parameters.`);
                } else if (intent === 'CONTRATO') {
                    console.log(`📜 [Router] Intent is CONTRATO. Keeping base router to extract parameters.`);
                }
            }
        }

        console.log(`🎯 [Router] Routing to expert: ${promptFile}`);
        let prompt = input.promptOverride || this.getExpertPrompt(promptFile);

        // Fetch Last Action Context
        const lastActionContext = context.lastAction || { intent: 'null', summary: 'null', timestamp: null };
        let timeDiffStr = 'Indefinido';

        if (lastActionContext.timestamp) {
            const lastAt = new Date(lastActionContext.timestamp);
            const seconds = Math.floor((nowUTC.getTime() - lastAt.getTime()) / 1000);

            if (seconds < 60) timeDiffStr = `${seconds} segundos`;
            else if (seconds < 3600) timeDiffStr = `${Math.floor(seconds / 60)} minutos`;
            else timeDiffStr = `${Math.floor(seconds / 3600)} horas`;
        }

        // Fetch Knowledge Base (Products)
        const productsList = await db.select().from(products).limit(5); // Top 5 for context
        const kbStr = productsList.map(p => `- ${p.name}: $${p.price}. ${p.description?.substring(0, 100)}...`).join('\n');

        // Inject Custom V3 Placeholders (Only for Public Ventas to avoid bias for Admin)
        const kbContext = role === 'ventas' || role === 'vendedores' ? kbStr : 'No aplica para este rol administrativo.';
        prompt = prompt.replace('{{KNOWLEDGE_BASE}}', kbContext);
        prompt = prompt.replace('{{INTERNAL_DIGEST}}', internalDigest);
        prompt = prompt.replace('{{INPUT}}', internalDigest); // Backwards compatibility for prompts
        prompt = prompt.replace('{{CONTACT_INFO}}', `Nombre: ${context.contact_name || 'Desconocido'}, Empresa: ${context.business_name || 'Desconocida'}`);

        // Inject Entity Memory (Persistent Digest)
        prompt = prompt.replace('{{ENTITY_DIGEST}}', entityDigest);

        // Inject Conversational Memory Placeholders
        prompt = prompt.replace('{{LAST_ACTION}}', lastActionContext.summary || 'null');
        prompt = prompt.replace('{{LAST_ACTION_TIMESTAMP}}', lastActionContext.timestamp ? format(toZonedTime(new Date(lastActionContext.timestamp), TIMEZONE), "yyyy-MM-dd HH:mm:ss") : 'null');
        prompt = prompt.replace('{{TIME_SINCE_LAST_ACTION}}', timeDiffStr);

        // Inject History
        prompt = prompt.replace('{{HISTORY}}', history);

        // Inject Time (Zoned to America/Guayaquil)
        prompt = prompt.replace('{{CURRENT_DATE}}', format(nowZoned, "yyyy-MM-dd"));
        prompt = prompt.replace('{{CURRENT_DAY_NAME}}', format(nowZoned, "EEEE", { locale: es }));
        prompt = prompt.replace('{{CURRENT_TIME}}', format(nowZoned, "HH:mm"));
        prompt = prompt.replace('{{TIME}}', format(nowZoned, "HH:mm")); // Alias for public_donna


        // Ensure JSON mode requirement is met in the prompt for OpenAI compatibility
        if (!prompt.toLowerCase().includes('json')) {
            prompt += `
\n\n## RESPUESTA OBLIGATORIA (FORMATO JSON)
Debes responder SIEMPRE con un objeto JSON válido. 
Estructura:
{
  "intent": "${intent}",
  "data": {
    "response": "Tu respuesta o contenido generado aquí"
  },
  "reasoning": "Breve explicación"
}
`;
        }

        try {
            // Optimized AI Call (FAST model)
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');

            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: internalDigest } // Separate user input
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content || "{}";

            let parsed: any = {};
            try {
                parsed = JSON.parse(content);
                // 🛡️ Preserve parameters extracted by Alejandra (like contact_name, interest_tier)
                // if the expert prompt omits them in its JSON output.
                if (extractedData) {
                    parsed.data = { ...extractedData, ...(parsed.data || {}) };
                }
            } catch (e) {
                console.warn('⚠️ [Router] Prompt did not return valid JSON. Falling back to CHAT intent.', e);
                parsed = {
                    intent: 'CHAT',
                    data: { response: content },
                    handover: false
                };
            }

            // --- V3 EXPERT HANDLING (Agenda, Tasks, etc.) ---
            if (parsed.status === 'incomplete' && (parsed.pregunta || parsed.clarification_question)) {
                const question = parsed.pregunta || parsed.clarification_question;
                if (input.source === 'client' && input.chatId) {
                    await customerMessagingService.sendHumanizedMessage(input.chatId, question, replyContext);
                } else if (input.source === 'cesar') {
                    await internalNotificationService.notifyCesar(question, replyContext);
                }
                return { status: 'incomplete', intent: intent, message: question };
            }

            if (parsed.status === 'ready' && (intent === 'SCHEDULE' || subtype === 'crear') && parsed.evento) {
                // Here we would call the actual Calendar Service
                const confirmation = `✅ ¡Entendido! He agendado: *${parsed.evento.titulo}* para el ${parsed.evento.fecha} a las ${parsed.evento.hora}.`;
                if (input.source === 'client' && input.chatId) {
                    await customerMessagingService.sendHumanizedMessage(input.chatId, confirmation, replyContext);
                } else {
                    await internalNotificationService.notifyCesar(confirmation, replyContext);
                }

                // TODO: Integrate with GoogleCalendarService
                console.log(`📅 [ACTION] Scheduling event:`, parsed.evento);
                return { status: 'ready', intent: intent, data: parsed.evento };
            }

            // --- CLARIFICATION FLOW (Legacy/General) ---
            if (parsed.needs_clarification && parsed.clarification_question) {
                if (input.source === 'client') {
                    await customerMessagingService.sendMessage(input.chatId!, parsed.clarification_question, replyContext);
                } else {
                    await this.sendToOriginalChannel(input, replyContext, parsed.clarification_question);
                }
                return { status: 'needs_clarification', message: parsed.clarification_question };
            }

            // --- FRACTIONATED MESSAGING ---
            if (input.source === 'client' && parsed.intent === 'CHAT') {
                const responseText = parsed.data?.response || parsed.reasoning || '';

                // Normal chat messages (send in fractions if needed, but for now direct)
                await customerMessagingService.sendHumanizedMessage(input.chatId!, responseText, replyContext);

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

                if (!input.skipSave) {
                    await this.saveMessage(input.chatId!, 'assistant', responseText, platform);
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
            const isQuery = parsed.intent?.includes('QUERY');

            if (rawName && !input.contactId && !isQuery) {
                const { entityResolver } = await import('./EntityResolverService');
                const { contactId: resolvedId } = await entityResolver.resolve(rawName);
                if (resolvedId) input.contactId = resolvedId;
            }

            // --- SPECIALIZED FLOW (Agenda, Cotizacion, etc.) ---
            await this.routeToTable(parsed, input.contactId, input.text, replyContext, input, history);

            // 🧠 BACK-PROPAGATION: Learning from conversation (Background)
            if (input.contactId && role !== 'cesar' && role !== 'abel') {
                this.enrichProfile(input.contactId, input.text).catch(e => console.error('Enrichment error:', e));
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
            return { status: 'error', error: error.message };
        }
    }

    private async routeToTable(parsed: any, contactId: string | undefined, originalText: string, replyContext: any, input: any, history: string = '') {
        const { intent, subtype, data } = parsed;
        const context = replyContext; // For backwards compatibility in this method
        console.log(`📍 Action: ${intent} (${subtype})`);

        try {
            switch (intent) {
                case 'SCHEDULE':
                    if (!data.date || !data.time) {
                        await this.sendToOriginalChannel(input, context, `Dale, necesito fecha y hora para agendarlo. ¿Cuándo es?`);
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

                    await this.sendToOriginalChannel(input, context,
                        `🗓️ **Agendado con éxito:**\n` +
                        `📌 ${data.title}\n` +
                        `⏰ ${format(startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}\n` +
                        `🔗 [Link al evento](${event.htmlLink})`
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

                    await this.sendToOriginalChannel(input, context, `✅ Tarea/Recordatorio guardado: **${data.title}**`);
                    break;

                case 'QUERY_AGENDA': // Changed from 'QUERY' to 'QUERY_AGENDA' for clarity and consistency
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

                            await this.sendToOriginalChannel(input, context, `📅 Revisando agenda para el **${format(baseDate, 'PPPP', { locale: es })}**...`);

                            const cal = await this.getCalendarService();
                            const agenda = await cal.listEvents(fromZonedTime(startOfDay, TIMEZONE).toISOString(), fromZonedTime(endOfDay, TIMEZONE).toISOString());

                            if (!agenda || agenda.length === 0) {
                                await this.sendToOriginalChannel(input, context, `✅ Todo libre para el ${format(baseDate, 'EEEE', { locale: es })}.`);
                            } else {
                                const list = agenda.map((e: any) => {
                                    const eventTime = e.start?.dateTime ? format(toZonedTime(new Date(e.start.dateTime), TIMEZONE), 'HH:mm') : 'Todo el día';
                                    return `• ${eventTime}: ${e.summary}`;
                                }).join('\n');
                                await this.sendToOriginalChannel(input, context, `📅 Eventos encontrados:\n\n${list}`);
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
                        await this.sendToOriginalChannel(input, context, `✅ Contacto **${data.contact_name}** registrado.`);
                    }
                    break;

                case 'SEND_MESSAGE': // Changed from 'SEND' to 'SEND_MESSAGE' for clarity
                    if (contactId && data.notes) {
                        const [c] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
                        if (c?.phone) {
                            await customerMessagingService.sendMessage(c.id, data.notes, { type: 'manual_via_donna' });
                            await this.sendToOriginalChannel(input, context, `📨 WhatsApp enviado a ${c.contactName}.`);
                        }
                    }
                    break;

                case 'COTIZACION':
                case 'CONTRATO':
                    await this.handleDocumentGeneration(parsed, contactId, originalText, replyContext, input, history);
                    break;

                case 'FINANZA':
                    await this.sendToOriginalChannel(input, context, `💰 **Registro de Finanza:**\n\n${originalText}`);
                    break;

                case 'VENTA':
                    await this.sendToOriginalChannel(input, context, `📊 **Registro de Venta:**\n\n${originalText}`);
                    break;

                default:
                    if (input.platform === 'telegram') {
                        await this.sendToOriginalChannel(input, context, `Entiendo, lo proceso enseguida.`);
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

    private async enrichProfile(contactId: string, text: string) {
        if (!contactId || text.length < 10) return;
        try {
            const enricherPrompt = this.getExpertPrompt('profile_enricher.md');
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');

            const prompt = enricherPrompt.replace('{notes}', text);

            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'system', content: prompt }, { role: 'user', content: 'Analiza el mensaje y devuelve JSON.' }],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(response.choices[0]?.message?.content || '{}');

            // Only update fields that have content
            const updateFields: any = {};
            if (result.pains) updateFields.pains = result.pains;
            if (result.goals) updateFields.goals = result.goals;
            if (result.objections) updateFields.objections = result.objections;
            if (result.businessName) updateFields.businessName = result.businessName;

            if (Object.keys(updateFields).length > 0) {
                await db.update(contacts).set(updateFields).where(eq(contacts.id, contactId));
                console.log(`🧠 [Memory] Profile enriched for contact ${contactId}`);
            }
        } catch (e) {
            console.warn('⚠️ Enrichment failed (Ignored):', e);
        }
    }

    private async sendToOriginalChannel(input: any, replyContext: any, text: string, media?: any) {
        // Helper: Replies on the same channel and number César originally wrote from
        if (input.chatId && (input.platform === 'whatsapp' || input.source === 'client')) {
            if (media) {
                await whatsappService.sendMessage(input.chatId, '', replyContext, media);
            } else {
                await whatsappService.sendMessage(input.chatId, text, replyContext);
            }
        } else {
            // Fallback to Telegram for commands originally from Telegram
            await internalNotificationService.notifyCesar(text, replyContext);
        }
    }

    private async handleDocumentGeneration(parsed: any, contactId: string | undefined, originalText: string, replyContext: any, input: any, history: string = '') {
        const { intent, data } = parsed;
        const contact = contactId ? (await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1))[0] : null;

        // Prefer extracted data over DB context for the specific document
        const contactName = data.contact_name || contact?.contactName || 'Prospecto';
        const businessName = data.business_name || contact?.businessName || 'Negocio';
        const pains = contact?.pains || 'Dolores no identificados aún';
        const plan = data.interest_tier || 'PRO';

        // 1. AI-Powered Qualification Check (Only for Quotations)
        if (intent === 'COTIZACION') {
            console.log('🤔 [Qualifier] Running AI-based context check...');
            try {
                const qualifierPrompt = this.getExpertPrompt('quotation_qualifier.md')
                    .replace('{{HISTORY}}', history || 'Sin historial previo.')
                    .replace('{{CURRENT_MESSAGE}}', originalText)
                    .replace('{{EXTRACTED_DATA}}', JSON.stringify(data));

                const aiClient = getAIClient('FAST');
                const modelId = getModelId('FAST');
                const qualResponse = await aiClient.chat.completions.create({
                    model: modelId,
                    messages: [{ role: 'system', content: qualifierPrompt }],
                    temperature: 0,
                    response_format: { type: 'json_object' }
                });

                const qualResult = JSON.parse(qualResponse.choices[0]?.message?.content || '{}');
                console.log('🤔 [Qualifier] Result:', qualResult.status);

                if (qualResult.status !== 'sufficient') {
                    const question = qualResult.question || 'César, faltan datos clave. ¿Cuál es el nombre del cliente y qué servicios quieres cotizar?';
                    await this.sendToOriginalChannel(input, replyContext, question);
                    return; // Stop here, do NOT generate yet
                }
                // status === 'sufficient' → fall through to generation
                console.log('✅ [Qualifier] Info sufficient. Proceeding to generate document.');
            } catch (qualError) {
                // If qualifier itself fails, proceed anyway to avoid blocking César
                console.warn('⚠️ [Qualifier] AI check failed, proceeding anyway:', qualError);
            }
        }

        // 2. Generate Text Content
        const catalog = this.getExpertPrompt('product_catalog.md');
        const isPremium = ['ELITE', 'IMPERIO', 'POSICIONAMIENTO'].includes(plan);
        const promptFile = intent === 'COTIZACION'
            ? (isPremium ? 'prompt_cotizacion_roja.md' : 'prompt_intro_cotizacion.md')
            : 'prompt_contrato_generic.md';

        let prompt = this.getExpertPrompt(promptFile);

        prompt = prompt.replace(/{{CONTACT_NAME}}/g, contactName);
        prompt = prompt.replace(/{{BUSINESS_NAME}}/g, businessName);
        prompt = prompt.replace(/{{PAINS}}/g, pains);
        prompt = prompt.replace(/{{PRODUCT_CATALOG}}/g, catalog);
        prompt = prompt.replace(/{{HISTORY}}/g, originalText);
        prompt = prompt.replace(/{{REQUESTED_PLAN}}/g, plan);
        prompt = prompt.replace(/{{AGREEMENTS}}/g, originalText);

        const aiClientGen = getAIClient('STANDARD');
        const modelIdGen = getModelId('STANDARD');

        // Send "processing" message on same channel
        const waitingMsg = `⏳ Dame un minuto, estoy redactando el ${intent === 'COTIZACION' ? 'borrador de la cotización' : 'contrato'}...`;
        await this.sendToOriginalChannel(input, replyContext, waitingMsg);

        const genResponse = await aiClientGen.chat.completions.create({
            model: modelIdGen,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: 'Por favor redacta el documento basado en nuestra discusión anterior.' }
            ],
            temperature: 0.7
        });

        const rawContent = genResponse.choices[0]?.message?.content || '';
        let docContent = rawContent;

        // 🛡️ Robust Extract: AI sometimes wraps JSON in markdown blocks
        let cleanText = rawContent.trim();
        if (cleanText.includes('```')) {
            // Remove any code block wrappers (```json, ```markdown, etc.)
            cleanText = cleanText.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();
        }

        try {
            // Check if it's still JSON
            const parsedContent = JSON.parse(cleanText);
            if (parsedContent.data?.response) {
                docContent = parsedContent.data.response;
            } else if (parsedContent.response) {
                docContent = parsedContent.response;
            } else {
                // If it's valid JSON but doesn't have our fields, maybe it's the raw text already
                docContent = cleanText;
            }
        } catch (e) {
            // If it's not valid JSON, it's likely raw markdown
            docContent = cleanText;
        }

        // Final cleanup for any leftover markdown markers
        docContent = docContent.replace(/^```markdown\n/m, '').replace(/```$/m, '').trim();

        // 3. Save to DB (Optional for contracts, mandatory for quotations)
        if (intent === 'COTIZACION' && contactId) {
            await db.update(contacts)
                .set({
                    quotation: docContent,
                    updatedAt: new Date()
                })
                .where(eq(contacts.id, contactId));
        }

        // 4. Generate PDF
        try {
            const pdfBuffer = await pdfDocumentService.generatePdf(docContent, intent === 'COTIZACION' ? 'quotation' : 'contract', {
                clientName: contactName,
                signerName: "Ing. César Reyes Jaramillo"
            });

            // 5. Upload to Meta (WhatsApp)
            const fileName = `${intent === 'COTIZACION' ? 'Cotizacion' : 'Contrato'}_${businessName.replace(/\s+/g, '_')}.pdf`;
            const uploadResult = await whatsappService.uploadMedia(pdfBuffer, fileName, 'application/pdf', 'document');

            if (uploadResult.success && uploadResult.mediaId) {
                const media: WhatsAppMedia = {
                    type: 'document',
                    id: uploadResult.mediaId,
                    filename: fileName,
                    caption: `📄 Aquí tienes el ${intent === 'COTIZACION' ? 'borrador de cotización' : 'contrato'} para ${businessName}.`
                };

                // ✅ FIX: Always reply on original channel (WhatsApp when César writes from there)
                await this.sendToOriginalChannel(input, replyContext, '', media);
            } else {
                throw new Error(uploadResult.error || 'Fallo upload a Meta');
            }
        } catch (pdfError: any) {
            console.error('❌ Error en flujo PDF:', pdfError);
            const fallbackMsg = `Generé el texto, pero hubo un error con el PDF: ${pdfError.message}\n\nTexto:\n${docContent}`;
            // ✅ FIX: Fallback text also goes to original channel
            await this.sendToOriginalChannel(input, replyContext, fallbackMsg);
        }
    }
}

export const cortexRouter = new CortexRouterService();
