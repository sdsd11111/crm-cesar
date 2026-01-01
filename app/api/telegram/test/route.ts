import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram/TelegramService';

export async function POST(req: Request) {
    try {
        let text = '🚀 ¡Test de Conexión Telegram Exitoso! Donna está lista.';
        try {
            const body = await req.json();
            if (body.text) text = body.text;
        } catch (e) {
            // Body is optional, ignore error
        }

        const result = await telegramService.sendMessage(text);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
