import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { note, leadId, leadName, source } = body;

        if (!note) {
            return NextResponse.json({ error: 'Note is required' }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const waReminderNumber = process.env.WHATSAPP_REMINDER_NUMBER || '0963410409'; // Default to user's number

        const messageText = `⏰ *RECORDATORIO DONNA*\n\n📝 *Nota:* ${note}\n👤 *Cliente:* ${leadName || 'Sin Nombre'}\n🆔 *ID:* ${leadId || 'N/A'}\n\n_Este lead permanece en tu cola para hoy._`;

        // 1. Send to Telegram
        if (botToken && chatId) {
            const { telegramService } = await import('@/lib/telegram/TelegramService');
            await telegramService.sendMessage(messageText);
        }

        // 2. Send to WhatsApp (Meta API)
        const waResult = await whatsappService.sendMessage(waReminderNumber, messageText.replace(/\*/g, '*'), {
            type: 'donna_reminder',
            leadId,
            leadName
        });

        return NextResponse.json({
            success: true,
            whatsapp: waResult.success,
            telegram: !!(botToken && chatId)
        });
    } catch (error) {
        console.error('Error sending Donna reminder:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
