import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: Request) {
    try {
        const { phone, text, metadata } = await req.json();

        if (!phone || !text) {
            return NextResponse.json({ success: false, error: 'Phone and text are required' }, { status: 400 });
        }

        const result = await whatsappService.sendMessage(phone, text, metadata || { type: 'trainer_manual' });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in WhatsApp Send API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
