import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { note, leadId, leadName, source } = body;

        if (!note) {
            return NextResponse.json({ error: 'Note is required' }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn('⚠️ Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const messageText = `⏰ *RECORDATORIO DONNA*\n\n📝 *Nota:* ${note}\n👤 *Cliente:* ${leadName || 'Sin Nombre'}\n🆔 *ID:* ${leadId || 'N/A'}\n\n_Este lead permanece en tu cola para hoy._`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'Markdown'
            }),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending Donna reminder:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
