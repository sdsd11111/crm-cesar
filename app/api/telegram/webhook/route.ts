import { NextRequest, NextResponse } from 'next/server';
import { cortexRouter } from '@/lib/donna/services/CortexRouterService';

/**
 * Telegram Webhook Endpoint
 * Receives messages/audios from @cesarobjetivo_bot
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Telegram sends updates in this format
        const message = body.message;

        if (!message) {
            return NextResponse.json({ ok: true });
        }

        // Extract text or voice message
        let inputText = '';
        let source: 'cesar' | 'client' = 'cesar'; // Default to César

        if (message.text) {
            inputText = message.text;
        } else if (message.voice) {
            // Download and transcribe voice message
            const fileId = message.voice.file_id;
            const duration = message.voice.duration;

            console.log(`🎤 Received voice message (${duration}s)`);

            // Send "processing" message to user
            await sendTelegramMessage('🎤 Procesando audio...');

            const transcription = await transcribeVoice(fileId);
            inputText = transcription;

            // Send transcription confirmation
            if (!transcription.startsWith('[Error')) {
                await sendTelegramMessage(`📝 Transcripción: "${transcription}"`);
            }
        }

        if (!inputText) {
            return NextResponse.json({ ok: true });
        }

        // Process with Cortex Router
        // Process with Cortex Router
        const result = await cortexRouter.processInput({
            text: inputText,
            source,
            chatId: message.chat?.id ? String(message.chat.id) : undefined
        });

        console.log('📥 Telegram message processed:', result);

        return NextResponse.json({ ok: true, result });
    } catch (error) {
        console.error('❌ Telegram Webhook Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

async function transcribeVoice(fileId: string): Promise<string> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        console.error('❌ OPENAI_API_KEY not configured');
        return '[Error: OpenAI API key not configured]';
    }

    try {
        // Step 1: Get file path from Telegram
        const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileResponse.json();

        if (!fileData.ok) {
            console.error('❌ Error getting file from Telegram:', fileData);
            return '[Error getting audio file]';
        }

        const filePath = fileData.result.file_path;
        const audioUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Step 2: Download audio file
        console.log('🎤 Downloading audio from Telegram...');
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();

        // Step 3: Convert to File object for Whisper API
        const audioFile = new File([audioBuffer], 'voice.ogg', { type: 'audio/ogg' });

        // Step 4: Send to Whisper API
        console.log('🤖 Transcribing with Whisper API...');

        // Load context prompt
        const fs = await import('fs');
        const path = await import('path');
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'audio_context.md');
        let promptText = '';
        try {
            promptText = fs.readFileSync(promptPath, 'utf-8');
        } catch (e) {
            console.warn('⚠️ Could not load audio context prompt');
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', process.env.WHISPER_MODEL || 'whisper-1');
        formData.append('language', 'es'); // Spanish
        if (promptText) {
            formData.append('prompt', promptText.substring(0, 224)); // Whisper limit
        }

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: formData,
        });

        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            console.error('❌ Whisper API Error:', errorText);
            return '[Error transcribing audio]';
        }

        const transcriptionData = await whisperResponse.json();
        const transcription = transcriptionData.text;

        console.log('✅ Transcription successful:', transcription);
        return transcription;

    } catch (error) {
        console.error('❌ Error in transcribeVoice:', error);
        return '[Error processing audio]';
    }
}

async function sendTelegramMessage(text: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('⚠️ Telegram credentials not configured');
        return;
    }

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        });
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error);
    }
}
