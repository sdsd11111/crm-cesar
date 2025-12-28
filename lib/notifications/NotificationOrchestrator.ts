import { db } from '@/lib/db';
import { contacts, loyaltyMissions, whatsappLogs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { planningEngine } from '@/lib/donna/services/PlanningEngine';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export class NotificationOrchestrator {
    /**
     * Main execution loop for daily notifications
     */
    async executeDailyOutreach() {
        console.log('🚀 NotificationOrchestrator: Starting outreach process...');

        // 1. Business Hours Check (9 AM - 7 PM)
        const hour = new Date().getHours();
        if (hour < 9 || hour >= 19) {
            console.log('😴 NotificationOrchestrator: Outside business hours. Postponing.');
            return { message: 'Outside business hours' };
        }

        // 2. Generate new missions based on today's triggers
        const planningResults = await planningEngine.generateDailyPlanning();
        console.log('📊 Planning Results:', planningResults);

        // 3. Fetch all APPROVED missions that are scheduled for TODAY or earlier
        // SAFETY CHECK: Never process future missions even if approved.
        const missions = await db
            .select()
            .from(loyaltyMissions)
            .where(
                and(
                    eq(loyaltyMissions.status, 'approved'),
                    sql`${loyaltyMissions.plannedAt} <= NOW()`
                )
            );

        const executionResults = {
            success: 0,
            failed: 0,
            total: missions.length
        };

        // 4. Global Velocity Limit: Max 3 messages per execution/hour to avoid Vercel Timeouts
        // STRICTLY SEQUENTIAL: Messages are sent ONE BY ONE. NEVER SIMULTANEOUSLY.
        const MAX_MESSAGES = 3;
        const missionsToProcess = missions.slice(0, MAX_MESSAGES);

        for (const mission of missionsToProcess) {
            try {
                // Fetch contact info
                const [contact] = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.id, mission.contactId as string))
                    .limit(1);

                if (!contact || !contact.phone) {
                    console.warn(`⚠️ Skipping mission ${mission.id}: No phone.`);
                    continue;
                }

                // CHECK OPT-OUT
                if (contact.whatsappOptOut) {
                    console.log(`🚫 Skipping mission ${mission.id}: Contact opted out.`);
                    await db.update(loyaltyMissions)
                        .set({ status: 'rejected', updatedAt: new Date() })
                        .where(eq(loyaltyMissions.id, mission.id));
                    continue;
                }

                // Antiban Delay: 8-20 seconds between individual messages
                const delay = Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000;
                console.log(`⏳ Antiban Delay: Waiting ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                // Change status to prevent double-processing (Lock)
                await db.update(loyaltyMissions)
                    .set({ status: 'executed' }) // We mark as executed BEFORE sending to prevent race conditions during long HTTP calls
                    .where(eq(loyaltyMissions.id, mission.id));

                const metadata = typeof mission.metadata === 'string'
                    ? JSON.parse(mission.metadata)
                    : mission.metadata;

                const message = this.buildMessage(contact, mission.content, metadata);

                // Send WhatsApp
                const response = await whatsappService.sendMessage(contact.phone, message);

                // LOG THE ATTEMPT
                await db.insert(whatsappLogs).values({
                    contactId: contact.id,
                    trigger: metadata.type || 'loyalty',
                    content: message,
                    status: response.success ? 'sent' : 'failed',
                    errorMessage: response.success ? null : (response.error || 'Unknown error'),
                    metadata: JSON.stringify(metadata),
                    createdAt: new Date()
                });

                if (response.success) {
                    executionResults.success++;
                } else {
                    // Revert status to approved if completely failed and want to retry? 
                    // No, better keep as executed/failed to avoid loops without manual intervention
                    executionResults.failed++;
                }
            } catch (error) {
                console.error(`❌ Error executing mission ${mission.id}:`, error);
                executionResults.failed++;
            }
        }

        return executionResults;
    }

    /**
     * Builds a message using "La Tribu" philosophy
     */
    private buildMessage(contact: any, content: string, metadata: any): string {
        const name = contact.contactName || contact.businessName || 'Estimado';

        switch (metadata.type) {
            case 'birthday':
                return `¡Hola ${name}! 🦁 En La Tribu estamos de fiesta hoy porque es tu cumpleaños. Tu aporte a la manada es vital y te deseamos lo mejor en este nuevo ciclo. ¡Que sea un día espectacular! 🎉`;

            case 'commitment_reminder':
                return `Hola ${name}, te saluda Donna de Objetivo. 🛡️\n\nPasaba educadamente a recordarte sobre el compromiso: "${content}". Es clave para que sigamos avanzando con la fuerza de la tribu. ¿Lograste avanzar con esto?`;

            case 'special_day':
                return `¡Hola ${name}! 🦁 Hoy se celebra el Día del ${metadata.profession} y no quería dejar pasar la oportunidad de felicitarte. Profesionales como tú son los que fortalecen nuestra comunidad. ¡Felicidades!`;

            default:
                return `Hola ${name}, te saluda Donna. 🛡️\n\n${content}`;
        }
    }
}

export const notificationOrchestrator = new NotificationOrchestrator();
