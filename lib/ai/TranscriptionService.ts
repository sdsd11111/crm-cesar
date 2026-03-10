import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * TranscriptionService: Handles audio-to-text conversion using OpenAI Whisper.
 */
export class TranscriptionService {
    private apiKey: string;
    private prompt: string = '';

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.loadPrompt();
    }

    private loadPrompt() {
        try {
            const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'transcriber.md');
            if (fs.existsSync(promptPath)) {
                this.prompt = fs.readFileSync(promptPath, 'utf-8');
            }
        } catch (error) {
            console.error('❌ TranscriptionService: Error loading prompt:', error);
        }
    }

    /**
     * Transcribes an audio buffer.
     */
    async transcribe(audioBuffer: Buffer, fileName: string = 'audio.ogg'): Promise<string | null> {
        if (!this.apiKey) {
            console.error('❌ TranscriptionService: OPENAI_API_KEY not configured');
            return null;
        }

        try {
            console.log(`📡 Sending audio to Gemini (${audioBuffer.byteLength} bytes)...`);

            // Reemplazado OpenAI Whisper con Gemini 2.0 Flash por límites de cuota
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const apiKey = process.env.GOOGLE_API_KEY;

            if (!apiKey) {
                console.error('❌ TranscriptionService: GOOGLE_API_KEY not configured');
                return null;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const base64Audio = audioBuffer.toString('base64');
            const transcriptionPrompt = this.prompt || "Transcribe este audio comercial en español. Solo devuelve el texto transcrito.";

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: "audio/ogg",
                        data: base64Audio
                    }
                },
                transcriptionPrompt
            ]);

            const responseText = result.response.text();
            return responseText ? responseText.trim() : '';
        } catch (error) {
            console.error('❌ TranscriptionService Gemini Error:', error);
            // Si la transcripción falla por cuota o error, devolvemos un marcador para que el router sepa que hubo un audio
            return "[Error en transcripción de audio]";
        }
    }
}

export const transcriptionService = new TranscriptionService();
