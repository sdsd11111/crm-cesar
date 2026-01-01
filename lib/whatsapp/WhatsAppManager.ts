import { db } from '../db';
import { interactions, contacts } from '../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { whatsappService } from './WhatsAppService';

export class WhatsAppManager {
    /**
     * Checks if a contact has sent a message in the last 24 hours.
     * This defines if we can use free-text or must use templates.
     */
    async isWithin24HourWindow(contactId: string): Promise<boolean> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const lastInbound = await db
            .select()
            .from(interactions)
            .where(
                and(
                    eq(interactions.contactId, contactId),
                    eq(interactions.direction, 'inbound'),
                    eq(interactions.type, 'whatsapp'),
                    gte(interactions.performedAt, twentyFourHoursAgo)
                )
            )
            .orderBy(desc(interactions.performedAt))
            .limit(1);

        return lastInbound.length > 0;
    }

    /**
     * Intelligent send: Chooses between Text or Template based on window.
     * @param contactId UUID of the contact
     * @param message Text for free-form fallback
     * @param templateName Meta Template Name
     * @param components Meta Template Parameters
     */
    async smartSend(contactId: string, message: string, templateName?: string, components: any[] = []): Promise<any> {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);

        if (!contact || !contact.phone) {
            return { success: false, error: 'Contact not found or has no phone' };
        }

        const hasWindow = await this.isWithin24HourWindow(contactId);

        if (hasWindow) {
            console.log(`🌀 WhatsAppManager: 24h Window ACTIVE for ${contact.contactName}. Sending free-text.`);
            return whatsappService.sendMessage(contact.phone, message, { contactId, type: 'smart_send_text' });
        } else if (templateName) {
            console.log(`🚪 WhatsAppManager: Window CLOSED for ${contact.contactName}. Using template: ${templateName}`);
            return whatsappService.sendTemplate(contact.phone, templateName, 'es_ES', components);
        } else {
            console.warn(`⚠️ WhatsAppManager: Window CLOSED and no template provided for ${contact.contactName}. Failing.`);
            return { success: false, error: 'Outside 24h window and no template provided' };
        }
    }
}

export const whatsappManager = new WhatsAppManager();
