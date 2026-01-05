import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) return new NextResponse('Missing ID', { status: 400 });

        const media = await whatsappService.getMedia(id);
        if (!media) {
            return new NextResponse('Media not found or expired', { status: 404 });
        }

        return new NextResponse(new Uint8Array(media.buffer), {
            headers: {
                'Content-Type': media.mimeType,
                'Cache-Control': 'public, max-age=3600, s-maxage=3600'
            }
        });
    } catch (error: any) {
        console.error('❌ Media Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
