import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: Request) {
    try {
        const { phone, text, template, metadata } = await req.json();

        if (!phone || (!text && !template)) {
            return NextResponse.json({ success: false, error: 'Phone and (text or template) are required' }, { status: 400 });
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
            result = await whatsappService.sendMessage(phone, text, metadata || { type: 'trainer_manual' });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in WhatsApp Send API:', error);
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
    }
}
