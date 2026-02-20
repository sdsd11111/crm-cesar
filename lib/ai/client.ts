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

        // 2. Configure Standard Client (Gemini API via OpenAI Compatibility endpoint)
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const openAIKey = process.env.OPENAI_API_KEY;

        if (googleApiKey) {
            this.standardClient = new OpenAI({
                apiKey: googleApiKey,
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            });
        } else if (openAIKey) {
            // Fallback to OpenAI if Google key is missing
            this.standardClient = new OpenAI({ apiKey: openAIKey });
        } else {
            throw new Error("Missing AI API Keys required for Standard functions.");
        }

        // 3. Configure Audio Client (OpenAI standard strictly)
        if (!openAIKey) throw new Error("OPENAI_API_KEY is required for Audio Transcription.");
        this.audioClient = new OpenAI({
            apiKey: openAIKey,
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
                return "gemini-1.5-pro"; // Activated Gemini 3.1 Pro equivalent
            case 'FAST':
                return "gemini-1.5-flash"; // Activated Fast Gemini
            case 'AUDIO':
                return "whisper-1";
            default:
                return "gemini-1.5-pro";
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
