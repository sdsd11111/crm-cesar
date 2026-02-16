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
            const formData = new FormData();
            const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
            formData.append('file', blob, fileName);
            formData.append('model', 'whisper-1');
            formData.append('language', 'es');

            if (this.prompt) {
                formData.append('prompt', this.prompt);
            }

            console.log(`📡 Sending audio to Whisper (${audioBuffer.byteLength} bytes)...`);
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ TranscriptionService: OpenAI API Error:', errorData);
                return null;
            }

            const result = await response.json();
            return result.text || '';
        } catch (error) {
            console.error('❌ TranscriptionService Error:', error);
            return null;
        }
    }
}

export const transcriptionService = new TranscriptionService();
