import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service responsible for parsing unstructured meeting notes
 * and extracting structured Commitment Drafts.
 */
export class CommitmentExtractor {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || "";
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Parses text and returns a list of proposed commitments using Gemini.
     */
    async extractFromNotes(notes: string): Promise<any[]> {
        if (!notes || notes.trim().length < 10) {
            return [];
        }

        console.log("🤖 Donna Analyzing Notes with Gemini...");

        const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
        const model = this.genAI.getGenerativeModel({ model: modelName });

        // Load prompt from file
        const fs = await import('fs');
        const path = await import('path');
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'commitment_extractor.md');
        const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
        const prompt = promptTemplate.replace('{notes}', notes);

        try {
            const result = await model.generateContent(prompt);
            const textResponse = result.response.text();

            // Basic cleanup of potential markdown blocks
            const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedJson);

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("❌ Donna Extraction Error:", error);
            return [];
        }
    }
}

export const commitmentExtractor = new CommitmentExtractor();
