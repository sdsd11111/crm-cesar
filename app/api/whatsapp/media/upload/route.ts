import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'image', 'video', 'audio', 'document'

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await whatsappService.uploadMedia(
            buffer,
            file.name,
            file.type,
            type || 'document'
        );

        if (result.success) {
            return NextResponse.json({
                success: true,
                mediaId: result.mediaId,
                fileName: file.name,
                mimeType: file.type
            });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error('❌ Error in WhatsApp Media Upload:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
