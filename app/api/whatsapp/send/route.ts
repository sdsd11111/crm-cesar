import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';
import { waTempStore } from '@/lib/whatsapp/temp-store';

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

        // [BYPASS] Log to Temp Store
        waTempStore.addLog({
            type: 'whatsapp',
            direction: 'outbound',
            content: text || `[Template: ${template?.name}]` || '[Multimedia]',
            performedAt: new Date().toISOString(),
            metadata: { result, target: phone }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in WhatsApp Send API:', error);
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
    }
}
