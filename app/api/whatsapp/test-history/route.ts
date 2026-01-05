import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
    try {
        // Fetch from both potential diagnostic tables
        const interactionLogs = await sql`
            SELECT id, 'interaction' as origin, type, direction, content, created_at, metadata::text as meta_str 
            FROM interactions 
            ORDER BY created_at DESC 
            LIMIT 30
        `;

        const waMsgLogs = await sql`
            SELECT id, 'wa_msg' as origin, 'whatsapp' as type, 'outbound' as direction, content, created_at, metadata::text as meta_str 
            FROM whatsapp_messages 
            ORDER BY created_at DESC 
            LIMIT 20
        `;

        // Combine and sort
        const combined = [...interactionLogs, ...waMsgLogs].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ success: true, logs: combined });
    } catch (error: any) {
        console.error('Diagnostic API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            tip: "Check if whatsapp_messages table exists or column names are correct"
        }, { status: 500 });
    }
}
