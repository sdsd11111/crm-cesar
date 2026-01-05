import { NextResponse } from 'next/server';
import { waTempStore } from '@/lib/whatsapp/temp-store';

export async function GET() {
    try {
        const logs = waTempStore.getLogs();
        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
