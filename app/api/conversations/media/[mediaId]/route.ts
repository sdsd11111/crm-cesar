import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function GET(
    request: Request,
    { params }: { params: { mediaId: string } }
) {
    try {
        const { mediaId } = params;

        if (!mediaId) {
            return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
        }

        const mediaData = await whatsappService.getMedia(mediaId);

        if (!mediaData) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 });
        }

        const base64 = mediaData.buffer.toString('base64');
        const dataUrl = `data:${mediaData.mimeType};base64,${base64}`;

        return NextResponse.json({
            mediaId,
            url: dataUrl
        });

    } catch (error: any) {
        console.error('Error fetching media content:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
