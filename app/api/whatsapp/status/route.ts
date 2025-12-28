import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const status = await whatsappService.fetchStatus();
        return NextResponse.json(status);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
