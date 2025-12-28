import OpenAI from 'openai';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export interface TimelineNarrative {
    current_intent: string;
    narrative_summary: string;
    active_discussions: string[];
    emotional_state: string;
    strategic_risk: number;
}

export class TimelineService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "",
        });
    }

    async synthesizeNarrative(contactId: string): Promise<TimelineNarrative | null> {
        // 1. Fetch last 10 interactions
        const recentInteractions = await db
            .select()
            .from(interactions)
            .where(eq(interactions.contactId, contactId))
            .orderBy(desc(interactions.createdAt))
            .limit(10);

        if (recentInteractions.length === 0) {
            return null;
        }

        // 2. Format for LLM (Reverse to make it chronological)
        const formattedInteractions = recentInteractions.reverse().map(i => {
            return `[${i.createdAt?.toISOString()}] TIPO: ${i.type}. CONTENIDO: ${i.content}`;
        }).join('\n');

        // 3. Load Prompt
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'timeline_synthesizer.md');
        const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
        const prompt = promptTemplate.replace('{interactions}', formattedInteractions);

        // 4. Call OpenAI
        // User requested the most economic model: gpt-4o-mini is the best balance of cost/speed/quality currently.
        const modelName = "gpt-4o-mini";

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "system", content: prompt }],
                model: modelName,
                response_format: { type: "json_object" }
            });

            const textResponse = completion.choices[0].message.content;
            if (!textResponse) return null;

            // Cleanup (OpenAI JSON mode is usually clean, but safety first)
            const parsed = JSON.parse(textResponse);

            return parsed as TimelineNarrative;
        } catch (error) {
            console.error("❌ TimelineService Error:", error);
            return null;
        }
    }
}

export const timelineService = new TimelineService();
