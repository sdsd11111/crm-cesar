import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '@/lib/db';
import { contacts, interactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export class AgentBriefingService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || "";
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateBriefing(contactId: string) {
        console.log(`🤖 Donna Generating Briefing for contact: ${contactId}`);

        // 1. Fetch Contact Context
        const [contact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contactId))
            .limit(1);

        if (!contact) throw new Error("Contact not found");

        // 2. Fetch recent interactions (last 5)
        const recentInteractions = await db
            .select()
            .from(interactions)
            .where(eq(interactions.contactId, contactId))
            .orderBy(desc(interactions.performedAt))
            .limit(5);

        const interactionsText = recentInteractions
            .map(i => `[${i.type}] ${i.content}`)
            .join("\n");

        // 3. Load prompt from file and generate with Gemini
        const fs = await import('fs');
        const path = await import('path');
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'agent_briefing.md');
        const promptTemplate = fs.readFileSync(promptPath, 'utf-8');

        const prompt = promptTemplate
            .replace('{contact_name}', contact.businessName || contact.contactName || 'N/A')
            .replace('{business_activity}', contact.businessActivity || 'N/A')
            .replace('{interested_product}', contact.interestedProduct || 'N/A')
            .replace('{interactions_history}', interactionsText || 'Sin interacciones previas registradas. Este es el momento de plantar la semilla de la confianza.');

        const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
        const model = this.genAI.getGenerativeModel({ model: modelName });

        try {
            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();
            const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedJson);
        } catch (error) {
            console.error("❌ Donna Briefing Error:", error);
            return null;
        }
    }
}

export const agentBriefingService = new AgentBriefingService();
