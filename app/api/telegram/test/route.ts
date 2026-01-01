import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram/TelegramService';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        const success = await telegramService.sendMessage(text || '🚀 ¡Test de Conexión Telegram Exitoso! Donna está lista.');

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Falla al enviar a Telegram. Revisa que TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID sean correctos en tu .env.local'
            }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
