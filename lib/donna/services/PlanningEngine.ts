import { db } from '@/lib/db';
import { contacts, commitments, loyaltyMissions, agents, interactions, reminders } from '@/lib/db/schema';
import { eq, and, or, sql, lte, isNull, desc, inArray } from 'drizzle-orm';
import { addDays, format, isSameDay } from 'date-fns';

export class PlanningEngine {
    /**
     * Scans all contacts and commitments to generate daily missions.
     * This is the "Planning" part Donna delivers.
     */
    async generateDailyPlanning() {
        console.log('🧠 PlanningEngine: Starting daily planning generation...');
        // ... Logic simplified for brevity or updated to call generatePlanningForContact in a loop
        const allProspects = await db.select({ id: contacts.id }).from(contacts);
        for (const p of allProspects) {
            await this.generatePlanningForContact(p.id);
        }
    }

    /**
     * Reactive Planning: Analyzes a specific contact for immediate opportunities.
     * Triggered by creation, updates, or interactions.
     */
    async generatePlanningForContact(contactId: string) {
        // 1. Data Gathering
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
        if (!contact) return;

        // 2. Logic: Birthday (Today) - Using Ecuador Timezone
        let isBirthdayToday = false;
        if (contact.birthday) {
            const bday = new Date(contact.birthday);
            const now = new Date();

            // Convert both dates to Ecuador timezone for comparison
            const bdayEcuador = new Date(bday.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
            const nowEcuador = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));

            if (bdayEcuador.getMonth() === nowEcuador.getMonth() && bdayEcuador.getDate() === nowEcuador.getDate()) {
                isBirthdayToday = true;
            }
        }

        // 3. Cooldown Check (Bypassed if it's birthday today for better dev experience)
        const [agent] = await db.select().from(agents).where(eq(agents.contactId, contactId)).limit(1);
        const now = new Date();

        if (!isBirthdayToday && agent?.lastPlannedAt && (now.getTime() - agent.lastPlannedAt.getTime() < 1000 * 60)) {
            console.log(`⏱️ PlanningEngine: Cooldown active (1 min) for ${contactId}. Skipping.`);
            return;
        }

        console.log(`🧠 PlanningEngine: Analyzing contact ${contactId}...`);

        // 2. Logic: Birthday (Today)
        if (isBirthdayToday) {
            const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
            console.log(`✅ PlanningEngine: Birthday match for ${contact.contactName}! Generating mission.`);
            await this.createMission({
                contactId: contact.id,
                source: 'micro',
                content: `Rugido Heroico: Hoy es cumpleaños de ${contact.contactName}. Enviar saludo especial de La Tribu. 🦁🎂`,
                metadata: { type: 'birthday', date: format(nowEcuador, 'yyyy-MM-dd') }
            });
        } else if (contact.birthday) {
            const bday = new Date(contact.birthday);
            const now = new Date();
            const bdayEcuador = new Date(bday.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
            const nowEcuador = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
            console.log(`❌ PlanningEngine: Birthday does not match today Ecuador (${bdayEcuador.getMonth() + 1}/${bdayEcuador.getDate()} vs ${nowEcuador.getMonth() + 1}/${nowEcuador.getDate()})`);
        } else {
            console.log(`ℹ️ PlanningEngine: No birthday set for ${contact.contactName}`);
        }

        // 4. Logic: Strategic Timeline Analysis (Contextual Follow-up)
        try {
            const { timelineService } = await import('./TimelineService');
            const narrative = await timelineService.synthesizeNarrative(contactId);

            if (narrative) {
                console.log(`🧠 PlanningEngine: Narrative Synthesized for ${contactId} -> ${narrative.current_intent}`);

                // Case A: Crisis/Risk -> Internal Alert
                if (narrative.strategic_risk > 7 || narrative.current_intent === 'RIESGO_FUGA') {
                    await this.sendInternalAlert({
                        title: `🚨 Riesgo Detectado: ${contact.businessName}`,
                        message: `Donna detectó inestabilidad: "${narrative.narrative_summary}". Recomendado intervenir manualmente.`,
                        taskId: null
                    });
                }

                // Case B: Activity/Interest -> WhatsApp Mission
                if (narrative.current_intent === 'ACTIVO' || narrative.current_intent === 'INTERESADO') {
                    // Check if there are active discussions to follow up on
                    if (narrative.active_discussions.length > 0) {
                        await this.createMission({
                            contactId: contact.id,
                            source: 'micro',
                            content: `Seguimiento de ${narrative.active_discussions[0]}: ${contact.contactName} se encuentra ${narrative.emotional_state.toLowerCase()}. ¿Podemos avanzar hoy?`,
                            metadata: { type: 'timeline_followup', state: narrative.current_intent }
                        });
                    }
                }
            }
        } catch (e) {
            console.error('⚠️ PlanningEngine: Error in Timeline analysis:', e);

            // Fallback to basic logic if AI fails
            const recentInteractions = await db.select()
                .from(interactions)
                .where(eq(interactions.contactId, contactId))
                .orderBy(desc(interactions.createdAt))
                .limit(1);

            if (recentInteractions.length > 0) {
                const last = recentInteractions[0];
                if (isSameDay(last.createdAt!, now) && (last.type === 'call' || last.type === 'meeting')) {
                    await this.createMission({
                        contactId: contact.id,
                        source: 'micro',
                        content: `Agradecimiento por reunión: Enviar mensaje a ${contact.contactName}.`,
                        metadata: { type: 'follow_up', interactionId: last.id }
                    });
                }
            }
        }

        // 5. Logic: Internal Alerts (Telegram)
        // If there's high pain or specific objections, notify Abel/César
        if (contact.pains?.includes('costo') || contact.objections?.includes('presupuesto')) {
            await this.sendInternalAlert({
                title: `⚠️ Alerta Estratégica: ${contact.businessName}`,
                message: `El cliente mencionó problemas de presupuesto. Donna sugiere revisar estrategia de descuentos o paquetes flexibles.`,
                taskId: null
            });
        }

        // 7. Logic: Natural Language Reminders from Tasks
        try {
            await this.extractTaskReminders(contactId);
        } catch (e) {
            console.error('⚠️ PlanningEngine: Error extracting task reminders:', e);
        }

        // 8. Update Cooldown
        if (agent) {
            await db.update(agents).set({ lastPlannedAt: now }).where(eq(agents.id, agent.id));
        }
    }

    /**
     * Scans tasks for a contact and extracts LLM-based reminders.
     */
    async extractTaskReminders(contactId: string) {
        const { tasks } = await import('@/lib/db/schema');
        const { GoogleGenerativeAI } = await import('@google/generative-ai');

        // 1. Fetch recent tasks for the contact
        const recentTasks = await db.select()
            .from(tasks)
            .where(eq(tasks.contactId, contactId))
            .orderBy(desc(tasks.createdAt))
            .limit(3);

        if (recentTasks.length === 0) return;

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
        const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const nowEcuador = new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' });

        for (const task of recentTasks) {
            const descLower = (task.description || '').toLowerCase();
            const titleLower = task.title.toLowerCase();

            // Only process tasks mentioning "Donna" or specific reminder keywords
            if (!descLower.includes('donna') && !descLower.includes('recuérdame') &&
                !titleLower.includes('donna') && !titleLower.includes('recuérdame')) continue;

            console.log(`🧠 PlanningEngine: Analyzing task for reminders: ${task.title}`);

            // Load Prompt
            const fs = await import('fs');
            const path = await import('path');
            const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'task_reminder_extractor.md');
            const promptTemplate = fs.readFileSync(promptPath, 'utf-8');

            const prompt = promptTemplate
                .replace('{title}', task.title)
                .replace('{description}', task.description || '')
                .replace('{now_ecuador}', nowEcuador);

            try {
                const result = await model.generateContent(prompt);
                const textResponse = result.response.text();
                const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedJson);

                if (Array.isArray(parsed)) {
                    for (const r of parsed) {
                        // Check if reminder already exists for this task to avoid duplicates
                        const [existing] = await db.select().from(reminders)
                            .where(and(
                                eq(reminders.taskId, task.id),
                                eq(reminders.message, r.message)
                            )).limit(1);

                        if (!existing) {
                            await db.insert(reminders).values({
                                taskId: task.id,
                                title: r.title,
                                message: r.message,
                                sendAt: new Date(r.sendAt),
                                status: 'pending',
                                channel: r.channel || 'telegram'
                            });
                            console.log(`✅ PlanningEngine: Created reminder for task ${task.id}: ${r.title}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ PlanningEngine: Error extracting reminders for task ${task.id}:`, error);
            }
        }
    }

    private async sendInternalAlert(alert: { title: string, message: string, taskId: string | null }) {
        // Suggested by user: Internal alerts via Telegram avoid WhatsApp risks
        await db.insert(reminders).values({
            title: alert.title,
            message: alert.message,
            sendAt: new Date(),
            status: 'pending',
            channel: 'telegram',
            taskId: alert.taskId
        });
    }

    private async createMission(params: {
        contactId: string;
        source: 'micro' | 'macro';
        content: string;
        metadata: any;
    }) {
        // Check if a mission for this same event already exists (to avoid spam)
        const [existing] = await db
            .select()
            .from(loyaltyMissions)
            .where(and(
                eq(loyaltyMissions.contactId, params.contactId),
                inArray(loyaltyMissions.status, ['pending', 'approved', 'executed', 'suggested_rejected']),
                sql`${loyaltyMissions.metadata}->>'type' = ${params.metadata.type}`
            ))
            .limit(1);

        if (existing) {
            console.log(`⏭️ PlanningEngine: Mission of type ${params.metadata.type} already exists for ${params.contactId}. Skipping.`);
            return;
        }

        console.log(`🚀 PlanningEngine: Creating mission for ${params.contactId}: ${params.content}`);
        await db.insert(loyaltyMissions).values({
            ...params,
            status: 'pending',
            plannedAt: new Date(),
            metadata: params.metadata // Drizzle jsonb handles objects
        });
    }
}

export const planningEngine = new PlanningEngine();
