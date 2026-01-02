import { NextRequest, NextResponse } from 'next/server';
import { AgendaManager } from '@/lib/donna/agents/agenda/AgendaManager';

const agendaManager = new AgendaManager();

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

        // 🛡️ FAST ACK & DROP: Detener tormenta de reintentos
        const messageDate = message.date; // Unix timestamp
        const now = Math.floor(Date.now() / 1000);
        const age = now - messageDate;

        if (age > 120) { // Si tiene más de 2 minutos
            console.warn(`⏳ Dropping old Telegram message (${age}s old). Stop retry storm.`);
            return NextResponse.json({ ok: true });
        }

        // Extract text or voice message
        let inputText = '';

        if (message.text) {
            inputText = message.text;
        } else if (message.voice) {
            // Download and transcribe voice message
            const fileId = message.voice.file_id;
            // Send "processing" message (Solo si es nuevo)
            await sendTelegramMessage('🎤 Procesando audio...', message.chat.id);
            const transcription = await transcribeVoice(fileId);
            inputText = transcription;

            // Send transcription confirmation
            if (!transcription.startsWith('[Error')) {
                await sendTelegramMessage(`📝 Transcripción: "${transcription}"`, message.chat.id);
            }
        }

        if (!inputText) {
            return NextResponse.json({ ok: true });
        }

        // 🧠 Proceso Aislado: Agenda Manager
        // Si el texto es muy corto o saludo, podríamos ignorarlo, pero dejemos que el Router decida.
        const result = await agendaManager.processInput(inputText, String(message.chat.id));

        // Responder al usuario
        if (result.reply) {
            await sendTelegramMessage(result.reply, message.chat.id);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Telegram Webhook Error:', error);
        return NextResponse.json({ ok: true }); // Siempre OK para que Telegram no reintente
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

async function sendTelegramMessage(text: string, chatId?: number | string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // Si no pasan chatId, usamos el de env (fallback), pero idealmente debe venir del mensaje
    const finalChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !finalChatId) {
        console.warn('⚠️ Telegram credentials not configured or chatId missing');
        return;
    }

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: finalChatId,
                text: text,
            }),
        });
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error);
    }
}
