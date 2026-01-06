
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { deepSeekService } from '@/lib/ai/DeepSeekService';
import fs from 'fs';
import path from 'path';

export class ProfileEnrichmentService {
    /**
     * Extracts profile information from WhatsApp interactions.
     * @param contactId Optional contact ID
     * @param phone Optional phone number (for ghost chats or unlinked contacts)
     */
    async enrichFromWhatsApp(contactId?: string, phone?: string): Promise<any> {
        console.log(`🤖 Enriching profile for ${contactId || phone}...`);

        // 1. Fetch recent interactions (last 50 messages)
        let query;
        if (contactId) {
            query = db.select()
                .from(interactions)
                .where(eq(interactions.contactId, contactId))
                .orderBy(desc(interactions.performedAt))
                .limit(50);
        } else if (phone) {
            // For ghost chats, we search by contact/phone in interactions if supported
            // Assuming interactions might have a metadata or phone field, 
            // but standardizing on contactId for now as per schema.
            // If it's a ghost chat, we'd need to find interactions by phone.
            // Let's assume for now we always have a contactId or a way to find them.
            // If not, we'd need to search interactions where content mentions the phone or similar.
            return { error: "Contact ID is required for now" };
        } else {
            return { error: "No target identified" };
        }

        const recentInteractions = await query;

        if (recentInteractions.length === 0) {
            console.log("⚠️ No interactions found for this contact.");
            return { error: "No hay conversaciones previas para analizar." };
        }

        // 2. Format interactions for the prompt
        const conversationText = recentInteractions
            .reverse() // chronological order
            .map(i => {
                const role = i.direction === 'inbound' ? 'CLIENTE' : 'COMERCIAL';
                const time = i.performedAt ? new Date(i.performedAt).toLocaleString() : '';
                return `[${time}] ${role}: ${i.content}`;
            })
            .join('\n');

        // 3. Load Prompt
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'profile_enricher.md');
        const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
        const prompt = promptTemplate.replace('{notes}', conversationText);

        // 4. Call DeepSeek
        try {
            const result = await deepSeekService.analyze(prompt);
            console.log("✅ DeepSeek Analysis Complete:", result);
            return result;
        } catch (error) {
            console.error("❌ Enrichment Error:", error);
            throw error;
        }
    }
}

export const profileEnrichmentService = new ProfileEnrichmentService();
