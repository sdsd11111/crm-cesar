import { db } from '@/lib/db';
import { conversationStates, contacts, interactions, tasks, commitments, events, reminders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fromZonedTime } from 'date-fns-tz';
import { getAIClient, getModelId } from '@/lib/ai/client';

const TIMEZONE = 'America/Guayaquil';

/**
 * Cortex Router: Intelligent Audio/Note Processing
 * Uses DeepSeek R1 (Reasoning) via Central AI Client to categorize inputs.
 */
export class CortexRouterService {
    private promptTemplate: string;
    private calendarService: any; // Lazy load to avoid import errors if lib missing

    constructor() {
        // Load prompt from file
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'cortex_router.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    }

    private async getCalendarService() {
        if (!this.calendarService) {
            const { GoogleCalendarService } = await import('@/lib/google/CalendarService');
            this.calendarService = new GoogleCalendarService();
        }
        return this.calendarService;
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
     * Process a transcribed audio or note from Telegram
     */
    async processInput(input: {
        text: string;
        source: 'cesar' | 'client';
        contactId?: string;
        chatId?: string; // Nuevo: Para gestión de estado
    }): Promise<any> {
        console.log(`🧠 Cortex Router processing input from: ${input.source}`);

        // PASO 0: Cargar Contexto
        const context = await this.getContext(input.chatId);
        let { contactId, pendingClarification } = context;

        // PASO 0.5: Manejar Clarificación Pendiente (si hay algo pendiente)
        if (pendingClarification) {
            const { entityResolver } = await import('./EntityResolverService');
            const result = await entityResolver.handleClarificationResponse(
                input.text,
                pendingClarification.entityName,
                pendingClarification.matches || [],
                this.sendTelegramMessage.bind(this)
            );

            if (result.contactId) {
                // Si se resolvió, continuar con la intención original
                await this.sendTelegramMessage(`✅ Perfecto. Procedo...`);

                // Limpiar clarificación ANTES de re-procesar para evitar loops
                await this.saveContext(input.chatId, { contactId: result.contactId });

                return await this.processInput({
                    ...input,
                    text: pendingClarification.originalText,
                    contactId: result.contactId
                });
            } else {
                // Si no se resolvió pero era un mensaje corto, podría ser un "cancelar" etc.
                const lower = input.text.toLowerCase();
                if (lower.includes('cancel') || lower.includes('no') || lower.includes('olvida')) {
                    await this.saveContext(input.chatId, { contactId });
                    await this.sendTelegramMessage(`👌 Tarea cancelada.`);
                    return { status: 'cancelled' };
                }
            }
        }

        let textToAnalyze = input.text;

        // PASO 0: RECUPERACIÓN DE CONTEXTO (Memoria a Corto Plazo)
        if (input.chatId) {
            const savedState = await db.select().from(conversationStates).where(eq(conversationStates.key, input.chatId));

            if (savedState.length > 0 && savedState[0].data) {
                const stateData = JSON.parse(savedState[0].data as string);

                // Si estábamos esperando una aclaración...
                if (stateData.state === 'WAITING_CLARIFICATION' && stateData.original_text) {
                    console.log('🔄 Context restored! Merging previous request with new input.');
                    textToAnalyze = `Solicitud anterior incompleta: "${stateData.original_text}".\nEl usuario respondió a la pregunta "${stateData.question}": "${input.text}".\n\nInstrucción: Completa la solicitud original usando la nueva información.`;

                    // Borramos el estado para evitar loops infinitos (si falla de nuevo, se creará uno nuevo)
                    await db.delete(conversationStates).where(eq(conversationStates.key, input.chatId));
                }
            }
        }

        // PASO 1 (NUEVO): Categorizar intención PRIMERO (Intent First) Usando REASONING MODEL
        const prompt = `${this.promptTemplate}\n\n---\n\nINPUT:\n${textToAnalyze}`;

        try {
            // USAR MODELO DE RAZONAMIENTO (AI STRATEGY MAP)
            const aiClient = getAIClient('REASONING');
            const modelId = getModelId('REASONING');

            console.log(`🧠 Invoking Cortex Brain with model: ${modelId}`);

            const response = await aiClient.chat.completions.create({
                model: modelId, // deepseek-reasoner
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            });

            const content = response.choices[0]?.message?.content || "{}";

            // DeepSeek Reasoner a veces incluye <think>...</think>. Lo limpiamos si es necesario, 
            // pero normalmente retorna el output final después del pensamiento. 
            // Si el output es JSON, extraemos el bloque JSON.

            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            // Buscar el primer '{' y el último '}' por si hay texto alrededor (chain of thought output suelto)
            const jsonStartIndex = cleaned.indexOf('{');
            const jsonEndIndex = cleaned.lastIndexOf('}');

            let finalJsonStr = cleaned;
            if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                finalJsonStr = cleaned.substring(jsonStartIndex, jsonEndIndex + 1);
            }

            const parsed = JSON.parse(finalJsonStr);

            // Si la confianza es baja, abortar
            if (parsed.confidence < 0.8 && parsed.uncertainty_message) {
                await this.sendTelegramMessage(parsed.uncertainty_message);
                return { status: 'uncertain', message: parsed.uncertainty_message };
            }

            // PASO 1.5: HEURÍSTICA DE SEGURIDAD (Guardrails)
            if (parsed.intent === 'CANCEL_NOTIFICATION') {
                const lowerText = textToAnalyze.toLowerCase();
                const negativeKeywords = ['cancel', 'borr', 'elimi', 'deten', 'ya no', 'stop', 'olvida'];
                const positiveKeywords = ['avisa', 'acuerd', 'record', 'antes', 'minutos', 'recuérdame'];

                const hasNegative = negativeKeywords.some(w => lowerText.includes(w));
                const hasPositive = positiveKeywords.some(w => lowerText.includes(w));

                if (!hasNegative && hasPositive) {
                    console.log('🛡️ Guardrail triggered: Switching CANCEL_NOTIFICATION -> OPERATIVE_TASK');
                    parsed.intent = 'OPERATIVE_TASK';
                    if (!parsed.analysis) parsed.analysis = {};
                    if (!parsed.analysis.motive) parsed.analysis.motive = textToAnalyze;

                    if (!parsed.analysis.reminder_offsets && (lowerText.includes('minutos') || lowerText.includes('antes'))) {
                        const matches = lowerText.match(/(\d+)\s*(min|m)/g);
                        if (matches) {
                            parsed.analysis.reminder_offsets = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0')).filter(n => n > 0);
                        }
                    }
                }
            }

            // PASO 2: Resolver Entidades
            const rawName = parsed.entities?.contact_name;
            const isInvalidName = !rawName || ['n/a', 'na', 'no aplica', 'unknown', 'nadie', 'null', 'none'].includes(rawName.toLowerCase());

            if (!input.contactId && !isInvalidName) {
                const { entityResolver } = await import('./EntityResolverService');

                if (parsed.intent === 'CREATE_CONTACT') {
                    const matches = await entityResolver.findContactByName(rawName);
                    if (matches.length > 0) {
                        input.contactId = matches[0].id;
                        console.log(`⚠️ Contact ${rawName} already exists. Using ID: ${input.contactId}`);
                        await this.sendTelegramMessage(`ℹ️ El contacto ${rawName} ya existe. Lo usaré.`);
                        parsed.intent = 'OPERATIVE_TASK';
                    } else {
                        console.log(`✅ New contact intended: ${rawName}`);
                    }
                }
                else {
                    const allowedTables = parsed.intent === 'SEND_WHATSAPP' ? ['contacts'] : undefined;
                    const { contactId: resolvedContactId, matches } = await entityResolver.resolve(
                        rawName,
                        this.sendTelegramMessage.bind(this),
                        allowedTables
                    );

                    if (resolvedContactId) {
                        input.contactId = resolvedContactId;
                    } else {
                        await this.saveContext(input.chatId, {
                            contactId,
                            pendingClarification: {
                                type: 'entity',
                                entityName: rawName,
                                originalText: textToAnalyze,
                                matches: matches
                            }
                        });
                        return {
                            status: 'needs_clarification',
                            message: 'Esperando aclaración de entidad'
                        };
                    }
                }
            }

            // PASO 3: Enrutar a la tabla correcta
            await this.routeToTable(parsed, input.contactId, textToAnalyze, input.chatId);

            return { status: 'success', intent: parsed.intent, summary: parsed.summary, analysis: parsed.analysis };

        } catch (error: any) {
            console.error('❌ Cortex Router Error:', error);
            await this.sendTelegramMessage(`❌ Donna tuvo un error procesando eso: ${error.message || 'Error desconocido'}`);
            return { status: 'error', error };
        }
    }

    private async routeToTable(parsed: any, contactId: string | undefined, textToAnalyze: string, chatId?: string) {
        console.log(`📍 Routing to: ${parsed.action?.table || 'unknown'}`);

        try {
            switch (parsed.intent) {
                case 'CREATE_CONTACT':
                    const newContact = await db.insert(contacts).values({
                        contactName: parsed.entities?.contact_name || null,
                        businessName: parsed.entities?.business_name || null,
                        phone: parsed.entities?.phone || null,
                        email: parsed.entities?.email || null,
                        source: 'donna_telegram',
                        status: 'new',
                    }).returning();

                    const createdContactId = newContact[0].id;
                    console.log(`✅ Contact created: ${createdContactId}`);

                    try {
                        const { agentService } = await import('@/lib/donna/services/AgentService');
                        await agentService.ensureAgent(createdContactId);
                    } catch (e) {
                        console.error('⚠️ CortexRouter: Error initializing agent:', e);
                    }

                    await db.insert(tasks).values({
                        title: `📝 Completar información de ${parsed.entities?.contact_name || parsed.entities?.business_name}`,
                        description: `Contacto creado por Donna. Revisar y completar datos faltantes.`,
                        status: 'todo',
                        priority: 'high',
                        contactId: createdContactId,
                        assignedTo: 'César',
                    });

                    await this.sendTelegramMessage(
                        `✅ Contacto creado exitosamente!\n\n` +
                        `👤 ${parsed.entities?.contact_name || 'Sin nombre'}\n` +
                        `🏢 ${parsed.entities?.business_name || 'Sin empresa'}\n` +
                        `📞 ${parsed.entities?.phone || 'Sin teléfono'}\n\n` +
                        `He creado una tarea para que completes la información.`
                    );
                    break;

                case 'OPERATIVE_TASK':
                    const newTask = await db.insert(tasks).values({
                        title: parsed.summary || 'Nueva tarea',
                        description: parsed.analysis ?
                            `Para: ${parsed.analysis.target_audience}\nMotivo: ${parsed.analysis.motive}\nFecha: ${parsed.analysis.due_date}\nHora: ${parsed.analysis.due_time}` :
                            (parsed.action?.details || ''),
                        status: 'todo',
                        priority: 'medium',
                        contactId: contactId || null,
                        assignedTo: 'César',
                    }).returning();

                    const taskId = newTask[0].id;
                    console.log('✅ Task created successfully');

                    let dueDate: Date | null = null;
                    if (parsed.analysis?.due_date && parsed.analysis?.due_time) {
                        const dueIso = `${parsed.analysis.due_date}T${parsed.analysis.due_time}:00-05:00`;
                        dueDate = new Date(dueIso);
                    } else if (textToAnalyze.match(/en\s+(\d+)\s*(min|minuto)/i)) {
                        const match = textToAnalyze.match(/en\s+(\d+)\s*(min|minuto)/i);
                        const minutes = parseInt(match![1]);
                        dueDate = new Date(Date.now() + minutes * 60000);
                        console.log(`⏰ Detected relative time: ${minutes} minutes from now -> ${dueDate.toISOString()}`);
                    }

                    if (dueDate && parsed.analysis?.reminder_offsets) {
                        for (const offset of parsed.analysis.reminder_offsets) {
                            const sendAt = new Date(dueDate.getTime() - offset * 60000);
                            await db.insert(reminders).values({
                                taskId: taskId,
                                title: `🔔 Recordatorio: ${parsed.summary}`,
                                message: `Faltan ${offset} min para: ${parsed.summary}`,
                                sendAt: sendAt,
                                status: 'pending',
                                channel: 'telegram'
                            });
                            console.log(`⏰ Reminder scheduled for task ${taskId} at ${sendAt.toISOString()}`);
                        }
                    }

                    await this.sendTelegramMessage(
                        `✅ Tarea creada\n\n` +
                        `📋 ${parsed.summary || 'Nueva tarea'}\n` +
                        (parsed.analysis?.reminder_offsets ? `⏰ Recordatorios programados: ${parsed.analysis.reminder_offsets.join(', ')} min antes.` : '')
                    );
                    break;

                case 'SCHEDULE_MEETING':
                    if (!parsed.analysis?.due_date || !parsed.analysis?.due_time) {
                        console.log('⚠️ Missing date/time for meeting. Asking clarification.');
                        const question = `❓ Necesito más detalles para agendar la cita con ${parsed.entities?.contact_name || 'el contacto'}.\n\n` +
                            `Entendí que es a las ${parsed.analysis?.due_time || '?'}, pero...\n` +
                            `**¿Para qué día es?** (Responde: "Es para mañana", "Para el lunes", etc.)`;

                        await this.sendTelegramMessage(question);

                        if (chatId) {
                            await db.insert(conversationStates).values({
                                key: chatId,
                                data: JSON.stringify({
                                    state: 'WAITING_CLARIFICATION',
                                    original_text: textToAnalyze,
                                    question: '¿Qué día?'
                                })
                            }).onConflictDoUpdate({
                                target: conversationStates.key,
                                set: { data: JSON.stringify({ state: 'WAITING_CLARIFICATION', original_text: textToAnalyze, question: '¿Qué día?' }), updatedAt: new Date() }
                            });
                        }
                        return;
                    }

                    const dateTimeStr = `${parsed.analysis.due_date} ${parsed.analysis.due_time}`;
                    const startDate = fromZonedTime(dateTimeStr, TIMEZONE);
                    const endDate = new Date(startDate.getTime() + 60 * 60000);

                    const calendar = await this.getCalendarService();
                    const event = await calendar.createEvent(
                        parsed.summary || 'Reunión CRM',
                        `Organizada por Donna para: ${parsed.analysis.target_audience || 'Cliente'}\nMotivo: ${parsed.analysis.motive || 'Reunión'}\nContacto: ${parsed.entities?.contact_name || 'N/A'}\nContexto: ${textToAnalyze}`,
                        startDate.toISOString(),
                        endDate.toISOString()
                    );

                    await db.insert(events).values({
                        title: parsed.summary || 'Reunión Agendada',
                        description: `GCal Link: ${event.htmlLink}\nMeet: ${event.hangoutLink || 'N/A'}`,
                        startTime: startDate,
                        endTime: endDate,
                        contactId: contactId || null,
                        status: 'scheduled',
                        location: event.hangoutLink || 'Zoom/Meet'
                    });

                    await this.sendTelegramMessage(
                        `🗓️ Reunión Agendada en Google Calendar\n\n` +
                        `📝 ${parsed.summary}\n` +
                        `⏰ ${parsed.analysis.due_date} ${parsed.analysis.due_time}\n` +
                        `🔗 ${event.htmlLink}`
                    );
                    break;

                case 'CANCEL_NOTIFICATION':
                    await db.update(reminders)
                        .set({ status: 'cancelled' })
                        .where(eq(reminders.status, 'pending'));

                    await this.sendTelegramMessage('🔕 He cancelado todos los recordatorios pendientes.');
                    break;

                case 'MEMORY_CUE':
                    if (contactId) {
                        await db.insert(interactions).values({
                            contactId: contactId,
                            type: 'note',
                            content: parsed.summary || '',
                        });
                        console.log('✅ Memory cue saved to interactions');
                        await this.sendTelegramMessage(
                            `🧠 Nota guardada\n\n` +
                            `"${parsed.summary}"\n\n` +
                            `La recordaré para futuras interacciones.`
                        );
                    } else {
                        console.warn('⚠️ Cannot save memory cue without contactId');
                        await this.sendTelegramMessage(
                            `⚠️ No pude guardar la nota porque no mencionaste a quién se refiere.`
                        );
                    }
                    break;

                case 'COMMITMENT':
                    if (contactId) {
                        await db.insert(commitments).values({
                            agentId: contactId,
                            title: parsed.summary || 'Nuevo compromiso',
                            description: parsed.analysis ?
                                `Motivo: ${parsed.analysis.motive}\nFecha: ${parsed.analysis.due_date} ${parsed.analysis.due_time}` :
                                (parsed.action?.details || ''),
                            actorRole: parsed.action?.actor || 'client',
                            status: 'draft',
                        });
                        console.log('✅ Commitment created successfully');
                        await this.sendTelegramMessage(
                            `🤝 Compromiso registrado\n\n` +
                            `"${parsed.summary}"\n\n` +
                            `Te recordaré cumplirlo.`
                        );
                    } else {
                        console.warn('⚠️ Cannot save commitment without contactId');
                        await this.sendTelegramMessage(
                            `⚠️ No pude registrar el compromiso porque no mencionaste con quién es.`
                        );
                    }
                    break;

                case 'STRATEGIC_NOTE':
                    await db.insert(interactions).values({
                        contactId: contactId,
                        type: 'note',
                        content: parsed.summary || '',
                    });
                    console.log('✅ Strategic note saved');
                    await this.sendTelegramMessage(
                        `💡 Insight estratégico guardado\n\n` +
                        `"${parsed.summary}"\n\n` +
                        `Lo tendré en cuenta para análisis futuros.`
                    );
                    break;

                case 'SEND_WHATSAPP':
                    if (contactId) {
                        const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
                        if (contact?.phone) {
                            const { whatsappService } = await import('@/lib/whatsapp/WhatsAppService');
                            const waContent = parsed.analysis?.motive || parsed.summary;

                            await this.sendTelegramMessage(`📨 Enviando WhatsApp a ${contact.contactName}...`);

                            const res = await whatsappService.sendMessage(contact.phone, waContent, {
                                type: 'manual_via_donna',
                                source: 'telegram_voice'
                            });

                            if (res.success) {
                                await this.sendTelegramMessage(`✅ WhatsApp enviado a ${contact.contactName} correctamente.`);
                            } else {
                                await this.sendTelegramMessage(`❌ Error enviando WhatsApp: ${res.error}`);
                            }
                        } else {
                            await this.sendTelegramMessage(`⚠️ El contacto ${contact?.contactName || 'desconocido'} no tiene teléfono registrado.`);
                        }
                    } else {
                        await this.sendTelegramMessage(`⚠️ No pude encontrar a quién enviarle el WhatsApp.`);
                    }
                    break;

                default:
                    console.warn(`⚠️ Unknown intent: ${parsed.intent}`);
                    await this.sendTelegramMessage(`🤔 Entiendo que quieres hacer algo relacionado con "${parsed.summary || 'esto'}", pero no estoy segura de cómo procesar esa intención todavía (${parsed.intent}).`);
            }
        } catch (error) {
            console.error('❌ Error routing to table:', error);
            throw error;
        }
    }

    private async sendTelegramMessage(message: string) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) return;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });
    }
}

export const cortexRouter = new CortexRouterService();
