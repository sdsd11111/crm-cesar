import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const qr = await whatsappService.fetchQR();
        return NextResponse.json(qr);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
