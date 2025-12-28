import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export const dynamic = 'force-dynamic';

export async function DELETE() {
    try {
        const result = await whatsappService.logoutInstance();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
