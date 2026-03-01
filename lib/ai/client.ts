import OpenAI from "openai";

type AIIntent = 'REASONING' | 'STANDARD' | 'AUDIO' | 'FAST';

interface AIClientConfig {
    apiKey: string;
    baseURL?: string;
    defaultModel: string;
}

export class AIClient {
    private static instance: AIClient;

    private reasoningClient: OpenAI;
    private standardClient: OpenAI;
    private audioClient: OpenAI; // Usually standard OpenAI for Whisper

    private constructor() {
        // 1. Configure Reasoning Client (DeepSeek)
        const deepSeekKey = process.env.DEEPSEEK_API_KEY;
        this.reasoningClient = new OpenAI({
            apiKey: deepSeekKey || "dummy",
            baseURL: "https://api.deepseek.com",
        });

        // 2. Configure Standard Client (Fallback to DeepSeek since OpenAI quota is exhausted)
        const openAIKey = process.env.OPENAI_API_KEY;
        this.standardClient = new OpenAI({
            apiKey: deepSeekKey || openAIKey || "dummy",
            baseURL: deepSeekKey ? "https://api.deepseek.com" : undefined,
        });

        // 3. Configure Audio Client (OpenAI standard strictly, although currently out of quota)
        this.audioClient = new OpenAI({
            apiKey: openAIKey || "dummy",
        });
    }

    public static getInstance(): AIClient {
        if (!AIClient.instance) {
            AIClient.instance = new AIClient();
        }
        return AIClient.instance;
    }

    public getClient(intent: AIIntent): OpenAI {
        switch (intent) {
            case 'REASONING':
                return this.reasoningClient;
            case 'STANDARD':
            case 'FAST':
                return this.standardClient;
            case 'AUDIO':
                return this.audioClient;
            default:
                return this.standardClient;
        }
    }

    public getModel(intent: AIIntent): string {
        switch (intent) {
            case 'REASONING':
                return "deepseek-reasoner";
            case 'STANDARD':
                return "deepseek-chat"; // Fallback to DeepSeek
            case 'FAST':
                return "deepseek-chat"; // Fallback to DeepSeek
            case 'AUDIO':
                return "whisper-1";
            default:
                return "deepseek-chat";

        }
    }
}

// Helper shorthand
export function getAIClient(intent: AIIntent = 'STANDARD') {
    return AIClient.getInstance().getClient(intent);
}

export function getModelId(intent: AIIntent = 'STANDARD') {
    return AIClient.getInstance().getModel(intent);
}

// Transcribe helper kept for backward compatibility ease
export async function transcribeAudio(audioFile: File): Promise<string> {
    const client = getAIClient('AUDIO');
    try {
        const transcription = await client.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "es",
            prompt: "Transcribe este audio de una conversación comercial. Identifica nombres, fechas y montos.",
        });
        return transcription.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw new Error("Error al transcribir el audio");
    }
}
