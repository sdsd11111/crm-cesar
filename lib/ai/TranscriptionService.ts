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
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                console.error('❌ TranscriptionService: GEMINI_API_KEY not configured');
                return null;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const base64Audio = audioBuffer.toString('base64');

            const promptText = this.prompt
                ? `${this.prompt}\n\nTranscribe el siguiente audio exactamente como se escucha:`
                : "Transcribe el siguiente audio en español exactamente como se escucha. Solo responde con la transcripción, sin agregar notas ni comentarios adicionales.";

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: "audio/ogg",
                        data: base64Audio
                    }
                },
                promptText
            ]);

            const responseText = result.response.text();
            return responseText ? responseText.trim() : '';
        } catch (error) {
            console.error('❌ TranscriptionService Error:', error);
            return null;
        }
    }
}

export const transcriptionService = new TranscriptionService();
