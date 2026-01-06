import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, text, metadata, media } = body;

        console.log(`📤 Sending message to ${phone}...`);

        const result = await whatsappService.sendMessage(phone, text, metadata, media);

        if (result.success) {
            return NextResponse.json({ success: true, data: result.data });
        } else {
            console.error('❌ Send API Error:', result.error);
            return NextResponse.json({
                success: false,
                error: result.error,
                details: result.details
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('❌ Send API fatal error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
