import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: Request) {
    try {
        const { phone, text, template, metadata, media } = await req.json();

        if (!phone || (!text && !template && !media)) {
            return NextResponse.json({ success: false, error: 'Phone and (text or template or media) are required' }, { status: 400 });
        }

        let result;
        if (template) {
            result = await whatsappService.sendTemplate(
                phone,
                template.name,
                template.language?.code || 'es_ES',
                template.components || []
            );
        } else {
            result = await whatsappService.sendMessage(phone, text, metadata || { type: 'chat_manual' }, media);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in WhatsApp Send API:', error);
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
    }
}
