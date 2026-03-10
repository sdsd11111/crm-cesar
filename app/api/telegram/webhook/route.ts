import { NextRequest, NextResponse } from 'next/server';
import { cortexRouter } from '@/lib/donna/services/CortexRouterService';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Telegram Webhook Endpoint
 * Receives messages/audios from @cesarobjetivo_bot
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const updateId = body.update_id;
        const message = body.message;

        if (!message || !updateId) {
            return NextResponse.json({ ok: true });
        }

        // 🛡️ IDEMPOTENCY CHECK: Prevent double processing of the same update
        try {
            await db.execute(sql`
                INSERT INTO "webhook_events_processed" ("provider", "external_id") 
                VALUES ('telegram', ${String(updateId)})
            `);
        } catch (e) {
            // If unique constraint fails, it means we already processed this updateId
            console.warn(`[Telegram] Skipping duplicate update_id: ${updateId}`);
            return NextResponse.json({ ok: true });
        }

        // 🛡️ FAST ACK & DROP: Detener tormenta de reintentos
        const messageDate = message.date;
        const now = Math.floor(Date.now() / 1000);
        const age = now - messageDate;

        if (age > 600) {
            console.warn(`⏳ Dropping old Telegram message (${age}s old).`);
            return NextResponse.json({ ok: true });
        }

        // Extract text or voice message
        let inputText = '';

        if (message.text) {
            inputText = message.text;
        } else if (message.voice) {
            const fileId = message.voice.file_id;
            // Immediate feedback for voice processing
            await sendTelegramMessage('🎤 Procesando audio...', message.chat.id);
            const transcription = await transcribeVoice(fileId);
            inputText = transcription;

            if (!transcription.startsWith('[Error')) {
                await sendTelegramMessage(`📝 Transcripción: "${transcription}"`, message.chat.id);
            }
        }

        if (!inputText) {
            return NextResponse.json({ ok: true });
        }

        // 🧠 Cerebro Unificado: Cortex Router
        // We REMOVE 'onReply' because CortexRouterService.sendTelegramMessage 
        // already handles the sending internally. This prevents DOUBLE MESSAGES.
        await cortexRouter.processInput({
            text: inputText,
            source: 'cesar',
            chatId: String(message.chat.id)
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Telegram Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}

// ... helper functions transcribeVoice and sendTelegramMessage (OMITTED for brevity in write_to_file if I can just replace block) ...
// ACTUALLY, I must provide the full file or use replace_file_content.
// I will provide the full file to be safe since I'm changing the structure.

async function transcribeVoice(fileId: string): Promise<string> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) return '[Error: OpenAI API key missing]';

    try {
        const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileResponse.json();
        if (!fileData.ok) return '[Error getting audio file]';

        const audioUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();

        const audioFile = new File([audioBuffer], 'voice.ogg', { type: 'audio/ogg' });

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        formData.append('language', 'es');

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}` },
            body: formData,
        });

        if (!whisperResponse.ok) return '[Error transcribing audio]';
        const data = await whisperResponse.json();
        return data.text;
    } catch (error) {
        return '[Error processing audio]';
    }
}

async function sendTelegramMessage(text: string, chatId: number | string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) return;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text }),
        });
    } catch (e) { }
}
