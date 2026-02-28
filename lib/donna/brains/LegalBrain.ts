import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export interface LegalReviewResult {
    is_safe: boolean;
    contract_content: string;
    suggested_clauses: string[];
    missing_critical_info: string[];
    legal_reasoning: string;
}

export class LegalBrain {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || "";
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    private getPromptPath(): string {
        return path.join(process.cwd(), "lib/donna/prompts/prompt_legal_expert.md");
    }

    async reviewContract(
        rawContent: string,
        clientContext: any
    ): Promise<LegalReviewResult> {
        console.log("⚖️ [LegalBrain] Iniciando revisión legal de contrato...");

        try {
            const promptTemplate = fs.readFileSync(this.getPromptPath(), "utf-8");

            const model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = promptTemplate
                .replace("{{CONTRACT_BODY}}", rawContent)
                .replace("{{CLIENT_CONTEXT}}", JSON.stringify(clientContext, null, 2));

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return JSON.parse(text) as LegalReviewResult;
        } catch (error) {
            console.error("❌ [LegalBrain] Error en revisión legal:", error);
            throw error;
        }
    }
}

export const legalBrain = new LegalBrain();
