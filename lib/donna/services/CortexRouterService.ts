import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '@/lib/db';
import { conversationStates, loyaltyMissions, contacts, interactions, tasks, commitments, agents, events, reminders } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Guayaquil';

/**
 * Cortex Router: Intelligent Audio/Note Processing
 * Uses OpenAI/DeepSeek/Gemini to categorize inputs and route them to the correct tables.
 */
export class CortexRouterService {
    private ai: any;
    private promptTemplate: string;
    private calendarService: any; // Lazy load to avoid import errors if lib missing

    constructor() {
        // Load prompt from file
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'cortex_router.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');

        // Initialize AI client - Usar OpenAI
        const openaiKey = process.env.OPENAI_API_KEY;
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        const geminiKey = process.env.GOOGLE_API_KEY;

        if (openaiKey) {
            console.log('🤖 Using OpenAI as AI provider');
            this.ai = { provider: 'openai', apiKey: openaiKey };
        } else if (deepseekKey && false) { // Deshabilitado hasta agregar saldo
            this.ai = { provider: 'deepseek', apiKey: deepseekKey };
        } else {
            console.log('🤖 Using Gemini as AI provider');
            this.ai = new GoogleGenerativeAI(geminiKey || "");
        }
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

                // Si no fue una respuesta a la clarificación, el flujo sigue normal (ignora la clarificación anterior)
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

                    // Sintetizar nuevo prompt combinando la solicitud original y la respuesta actual
                    // "Agendar cita a las 5pm" + "Mañana" -> "Solicitud Original: Agendar cita a las 5pm. Aclaración del usuario: Mañana."
                    textToAnalyze = `Solicitud anterior incompleta: "${stateData.original_text}".\nEl usuario respondió a la pregunta "${stateData.question}": "${input.text}".\n\nInstrucción: Completa la solicitud original usando la nueva información.`;

                    // Borramos el estado para evitar loops infinitos (si falla de nuevo, se creará uno nuevo)
                    await db.delete(conversationStates).where(eq(conversationStates.key, input.chatId));
                }
            }
        }

        // PASO 1 (NUEVO): Categorizar intención PRIMERO (Intent First)
        const prompt = `${this.promptTemplate}\n\n---\n\nINPUT:\n${textToAnalyze}`;

        try {
            let response;
            if (this.ai.provider === 'openai') {
                response = await this.callOpenAI(prompt);
            } else if (this.ai.provider === 'deepseek') {
                response = await this.callDeepSeek(prompt);
            } else {
                const model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
                const result = await model.generateContent(prompt);
                response = result.response.text();
            }

            const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            // Si la confianza es baja, abortar
            if (parsed.confidence < 0.8 && parsed.uncertainty_message) {
                await this.sendTelegramMessage(parsed.uncertainty_message);
                return { status: 'uncertain', message: parsed.uncertainty_message };
            }


            // PASO 1.5: HEURÍSTICA DE SEGURIDAD (Guardrails)
            // Fix: GPT-4o-mini confunde "avísame antes" con "CANCEL_NOTIFICATION"
            if (parsed.intent === 'CANCEL_NOTIFICATION') {
                const lowerText = textToAnalyze.toLowerCase();
                const negativeKeywords = ['cancel', 'borr', 'elimi', 'deten', 'ya no', 'stop', 'olvida'];
                const positiveKeywords = ['avisa', 'acuerd', 'record', 'antes', 'minutos', 'recuérdame'];

                const hasNegative = negativeKeywords.some(w => lowerText.includes(w));
                const hasPositive = positiveKeywords.some(w => lowerText.includes(w));

                // Si NO hay palabras negativas explícitas, y SÍ hay palabras de recordatorio, asumimos que es una tarea.
                if (!hasNegative && hasPositive) {
                    console.log('🛡️ Guardrail triggered: Switching CANCEL_NOTIFICATION -> OPERATIVE_TASK');
                    parsed.intent = 'OPERATIVE_TASK';
                    // Re-analizar para asegurar que el summary/analysis tenga sentido es difícil sin re-prompting,
                    // pero confiamos en que el LLM llenó los otros campos (analysis) aunque le dio la etiqueta mal.
                    // Si analysis está vacío, lo llenamos por defecto.
                    if (!parsed.analysis) parsed.analysis = {};
                    if (!parsed.analysis.motive) parsed.analysis.motive = textToAnalyze;

                    // Intentar extraer offsets si no existen
                    if (!parsed.analysis.reminder_offsets && (lowerText.includes('minutos') || lowerText.includes('antes'))) {
                        // Extracción regex básica de emergencia para "5 minutos" o "2 min"
                        const matches = lowerText.match(/(\d+)\s*(min|m)/g);
                        if (matches) {
                            parsed.analysis.reminder_offsets = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0')).filter(n => n > 0);
                        }
                    }
                }
            }

            // PASO 2: Resolver Entidades (Estrategia según Intención)
            // Solo intentamos resolver si no tenemos ya un ID y la IA detectó un nombre
            // PASO 2: Resolver Entidades (Estrategia según Intención)
            // Solo intentamos resolver si no tenemos ya un ID y la IA detectó un nombre VÁLIDO
            const rawName = parsed.entities?.contact_name;
            const isInvalidName = !rawName || ['n/a', 'na', 'no aplica', 'unknown', 'nadie', 'null', 'none'].includes(rawName.toLowerCase());

            if (!input.contactId && !isInvalidName) {
                const { entityResolver } = await import('./EntityResolverService');

                // Estrategia para CREAR CONTACTO
                if (parsed.intent === 'CREATE_CONTACT') {
                    // Verificar si ya existe (solo warning)
                    const matches = await entityResolver.findContactByName(rawName);
                    if (matches.length > 0) {
                        // Existe: avisar pero permitir crear si el usuario insiste (o asumir que es el mismo)
                        input.contactId = matches[0].id;
                        console.log(`⚠️ Contact ${rawName} already exists. Using ID: ${input.contactId}`);
                        await this.sendTelegramMessage(`ℹ️ El contacto ${rawName} ya existe. Lo usaré.`);
                        parsed.intent = 'OPERATIVE_TASK'; // Fallback para no crear doble
                    } else {
                        // No existe: PERFECTO. No hacemos nada aquí, el case 'CREATE_CONTACT' lo creará.
                        console.log(`✅ New contact intended: ${rawName}`);
                    }
                }
                // Estrategia para OTROS (Tareas, Compromisos, etc.)
                else {
                    // Aquí SÍ necesitamos resolverlo estrictamente
                    // Si el intent es SEND_WHATSAPP, restringimos a 'contacts'
                    // Pero espera, el routing a SEND_WHATSAPP ocurre abajo (después del switch).
                    // El intent se decide ARRIBA (Parsed).
                    // PERO el "Resolver" corre ANTES del switch.
                    // Necesitamos pasar el allowedTables basado en `parsed.intent`.

                    const allowedTables = parsed.intent === 'SEND_WHATSAPP' ? ['contacts'] : undefined;

                    const { contactId: resolvedContactId, matches } = await entityResolver.resolve(
                        rawName,
                        this.sendTelegramMessage.bind(this),
                        allowedTables
                    );

                    if (resolvedContactId) {
                        input.contactId = resolvedContactId;
                    } else {
                        // Guardar estado de clarificación para la siguiente respuesta
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

    private async callDeepSeek(prompt: string) {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.ai.apiKey}`
            },
            body: JSON.stringify({
                model: process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🤖 DeepSeek Response:', JSON.stringify(data, null, 2));

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid DeepSeek response format');
        }

        return data.choices[0].message.content;
    }

    private async callOpenAI(prompt: string) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.ai.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🤖 OpenAI Response:', JSON.stringify(data, null, 2));

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid OpenAI response format');
        }

        return data.choices[0].message.content;
    }

    private async routeToTable(parsed: any, contactId: string | undefined, textToAnalyze: string, chatId?: string) {
        console.log(`📍 Routing to: ${parsed.action?.table || 'unknown'}`);

        try {
            switch (parsed.intent) {
                case 'CREATE_CONTACT':
                    // Crear contacto directamente con los datos extraídos
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

                    // Initialize Agent and Trigger Planning
                    try {
                        const { agentService } = await import('@/lib/donna/services/AgentService');
                        await agentService.ensureAgent(createdContactId);
                    } catch (e) {
                        console.error('⚠️ CortexRouter: Error initializing agent:', e);
                    }

                    // Crear tarea de seguimiento
                    await db.insert(tasks).values({
                        title: `📝 Completar información de ${parsed.entities?.contact_name || parsed.entities?.business_name}`,
                        description: `Contacto creado por Donna. Revisar y completar datos faltantes.`,
                        status: 'todo',
                        priority: 'high',
                        contactId: createdContactId,
                        assignedTo: 'César',
                    });

                    // Enviar confirmación por Telegram
                    await this.sendTelegramMessage(
                        `✅ Contacto creado exitosamente!\n\n` +
                        `👤 ${parsed.entities?.contact_name || 'Sin nombre'}\n` +
                        `🏢 ${parsed.entities?.business_name || 'Sin empresa'}\n` +
                        `📞 ${parsed.entities?.phone || 'Sin teléfono'}\n\n` +
                        `He creado una tarea para que completes la información.`
                    );
                    break;

                case 'OPERATIVE_TASK':
                    // Guardar en tabla tasks
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

                    // CREAR RECORDATORIOS (REMINDERS) SI HAY OFFSETS
                    // Caso 1: Fecha/Hora absoluta ("mañana a las 3pm")
                    // Caso 2: Tiempo relativo ("en 5 minutos")

                    let dueDate: Date | null = null;

                    if (parsed.analysis?.due_date && parsed.analysis?.due_time) {
                        // Caso 1: Absoluto
                        const dueIso = `${parsed.analysis.due_date}T${parsed.analysis.due_time}:00-05:00`;
                        dueDate = new Date(dueIso);
                    } else if (textToAnalyze.match(/en\s+(\d+)\s*(min|minuto)/i)) {
                        // Caso 2: Relativo - "en X minutos"
                        const match = textToAnalyze.match(/en\s+(\d+)\s*(min|minuto)/i);
                        const minutes = parseInt(match![1]);
                        dueDate = new Date(Date.now() + minutes * 60000);
                        console.log(`⏰ Detected relative time: ${minutes} minutes from now -> ${dueDate.toISOString()}`);
                    }

                    if (dueDate && parsed.analysis?.reminder_offsets) {
                        for (const offset of parsed.analysis.reminder_offsets) {
                            const sendAt = new Date(dueDate.getTime() - offset * 60000); // offset in minutes
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

                    // Enviar confirmación
                    await this.sendTelegramMessage(
                        `✅ Tarea creada\n\n` +
                        `📋 ${parsed.summary || 'Nueva tarea'}\n` +
                        (parsed.analysis?.reminder_offsets ? `⏰ Recordatorios programados: ${parsed.analysis.reminder_offsets.join(', ')} min antes.` : '')
                    );
                    break;

                case 'SCHEDULE_MEETING':
                    // Agendar en Google Calendar (Solo Reuniones/Zoom)

                    // 1. VALIDACIÓN ESTRICTA DE FECHA/HORA
                    if (!parsed.analysis?.due_date || !parsed.analysis?.due_time) {
                        console.log('⚠️ Missing date/time for meeting. Asking clarification.');
                        const question = `❓ Necesito más detalles para agendar la cita con ${parsed.entities?.contact_name || 'el contacto'}.\n\n` +
                            `Entendí que es a las ${parsed.analysis?.due_time || '?'}, pero...\n` +
                            `**¿Para qué día es?** (Responde: "Es para mañana", "Para el lunes", etc.)`;

                        await this.sendTelegramMessage(question);

                        // GUARDAR ESTADO PARA CONTEXTO
                        if (chatId) {
                            await db.insert(conversationStates).values({
                                key: chatId,
                                data: JSON.stringify({
                                    state: 'WAITING_CLARIFICATION',
                                    original_text: textToAnalyze, // Guardamos lo que estábamos procesando
                                    question: '¿Qué día?'
                                })
                            }).onConflictDoUpdate({
                                target: conversationStates.key,
                                set: { data: JSON.stringify({ state: 'WAITING_CLARIFICATION', original_text: textToAnalyze, question: '¿Qué día?' }), updatedAt: new Date() }
                            });
                        }

                        return; // Detener flujo y esperar input del usuario
                    }

                    // 2. MANEJO ROBUTO DE ZONA HORARIA (America/Guayaquil)
                    // parsed.analysis.due_date = "2024-12-27"
                    // parsed.analysis.due_time = "17:00"
                    const dateTimeStr = `${parsed.analysis.due_date} ${parsed.analysis.due_time}`; // "2024-12-27 17:00"
                    // Interpretamos que esa hora ES en Guayaquil
                    const startDate = fromZonedTime(dateTimeStr, TIMEZONE);

                    // Fin = Inicio + 1 hora
                    const endDate = new Date(startDate.getTime() + 60 * 60000);

                    const calendar = await this.getCalendarService();
                    const event = await calendar.createEvent(
                        parsed.summary || 'Reunión CRM',
                        `Organizada por Donna para: ${parsed.analysis.target_audience || 'Cliente'}\nMotivo: ${parsed.analysis.motive || 'Reunión'}\nContacto: ${parsed.entities?.contact_name || 'N/A'}\nContexto: ${textToAnalyze}`,
                        startDate.toISOString(), // createEvent espera ISO string
                        endDate.toISOString()
                    );

                    // Insertar en eventos locales (Espejo)
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
                    // Cancelar recordatorios pendientes
                    // (Logica simplificada: cancela todos los pendientes del usuario o intenta buscar por contexto reciente si tuviéramos ID)
                    // Por ahora, cancela los recordatorios más próximos (próximas 2 horas) o TODOS?
                    // El usuario dijo "Ya estoy en camino, cancela".

                    // Update reminders set status = 'cancelled' where status = 'pending' and send_at < NOW() + 1 hour?
                    // O mejor, marcamos como cancelados todos los recordatorios OPERATIVOS pendientes de hoy.

                    // Importar desc y gt de drizzle-orm si faltan
                    // const { gt, lt } = await import('drizzle-orm');

                    // Implementación simple: Cancelar todo lo pendiente para hoy.
                    await db.update(reminders)
                        .set({ status: 'cancelled' })
                        .where(eq(reminders.status, 'pending'));

                    await this.sendTelegramMessage('🔕 He cancelado todos los recordatorios pendientes.');
                    break;

                case 'MEMORY_CUE':
                    // Guardar en tabla interactions como nota de memoria
                    if (contactId) {
                        await db.insert(interactions).values({
                            contactId: contactId,
                            type: 'note',
                            content: parsed.summary || '',
                        });
                        console.log('✅ Memory cue saved to interactions');

                        // Enviar confirmación
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
                    // Guardar en tabla commitments
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

                        // Enviar confirmación
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
                    // Guardar como nota estratégica para Donna Macro
                    await db.insert(interactions).values({
                        contactId: contactId,
                        type: 'note',
                        content: parsed.summary || '',
                    });
                    console.log('✅ Strategic note saved');

                    // Enviar confirmación
                    await this.sendTelegramMessage(
                        `💡 Insight estratégico guardado\n\n` +
                        `"${parsed.summary}"\n\n` +
                        `Lo tendré en cuenta para análisis futuros.`
                    );
                    break;

                case 'SEND_WHATSAPP':
                    // Enviar mensaje de WhatsApp directo
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
