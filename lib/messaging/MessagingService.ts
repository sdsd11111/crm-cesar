
import { IMessagingAdapter } from './interfaces';
import { db } from '@/lib/db';
import { contacts, clients, interactions, donnaChatMessages } from '@/lib/db/schema';
import { eq, or, desc, sql } from 'drizzle-orm';

import { WhatsAppAdapter } from './adapters/WhatsAppAdapter';
import { TelegramAdapter } from './adapters/TelegramAdapter';

export class MessagingService {
    private adapters: Map<string, IMessagingAdapter> = new Map();

    constructor() {
        console.log('📡 MessagingService Core Initialized');

        // Register default adapters
        this.registerAdapter(new WhatsAppAdapter());
        this.registerAdapter(new TelegramAdapter());
    }

    /**
     * Registers a new adapter (plug-in strategy)
     */
    registerAdapter(adapter: IMessagingAdapter) {
        this.adapters.set(adapter.providerId, adapter);
        console.log(`🔌 Adapter registered: ${adapter.providerId}`);
    }

    /**
     * Centralized Send Method
     * automatically determines the best channel for the contact
     */
    async send(contactId: string, text: string, metadata: any = {}) {
        try {
            // 1. Resolve Contact & Channel Preference
            const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);

            if (!contact) throw new Error('Contact not found');

            // Default to WhatsApp if not specified (legacy behavior)
            const channel = contact.channelSource || 'whatsapp';
            const adapter = this.adapters.get(channel);

            if (!adapter) throw new Error(`No adapter found for channel: ${channel}`);

            // 2. Delegate to Adapter
            // Prefer chat_id for Telegram, phone for WhatsApp
            // We might need a schema update to store distinct IDs, but now we use 'phone' as generic identifier or 'chat_id' if stored in metadata?
            // Pragma: For now, we assume 'phone' holds the identifier for WA, and we need a way for Telegram.
            // Temporary Logic for Telegram Migration:
            // If channel is telegram, we need the stored Chat ID. 
            // We'll look it up in 'donnaChatMessages' distinct or add a column later.
            // For now, let's assume contact.phone holds the ID if channel='telegram' OR look at interactions.

            const destination = contact.phone; // This needs to be robust for Telegram Chat IDs

            const result = await adapter.sendMessage(destination!, text, metadata);

            // 3. Centralized Logging (The "Zero-Refactor" Tables)
            if (result.success) {
                // Update Last Activity
                await db.update(contacts)
                    .set({
                        last_activity_at: new Date(),
                        updatedAt: new Date()
                    } as any) // Cast as any until schema is migrated
                    .where(eq(contacts.id, contactId));

                // Log to Donna Chat History (Unified View)
                await db.insert(donnaChatMessages).values({
                    chatId: destination!,
                    role: 'assistant',
                    content: text,
                    platform: channel as any,
                    metadata: { ...metadata, adapterResponse: result.data }
                });
            }

            return result;

        } catch (error: any) {
            console.error('MessagingService Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Context Retrieval with Identity Merging
     * Fetches history for a contact, OR all contacts belonging to the same Client.
     */
    async getUnifiedHistory(contactId: string, limit = 50) {
        // 1. Get Contact
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
        if (!contact) return [];

        let relatedPhoneNumbers = [contact.phone];

        // 2. Identity Merge Check
        // If linked to a client, fetch ALL phone numbers for that client
        let linkedClientId = (contact as any).client_id; // Will exist after migration
        if (linkedClientId) {
            const siblings = await db.select({ phone: contacts.phone })
                .from(contacts)
                .where(eq((contacts as any).client_id, linkedClientId));

            relatedPhoneNumbers = siblings.map(s => s.phone).filter(Boolean) as string[];
        }

        if (relatedPhoneNumbers.length === 0) return [];

        // 3. Fetch History for ALL related identifiers
        const history = await db.select()
            .from(donnaChatMessages)
            .where(
                sql`${donnaChatMessages.chatId} IN ${relatedPhoneNumbers}`
            )
            .orderBy(desc(donnaChatMessages.messageTimestamp))
            .limit(limit);

        return history.reverse();
    }
}

export const messagingService = new MessagingService();
