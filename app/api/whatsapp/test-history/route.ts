import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, whatsappLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch from both tables using Drizzle
        const interactionLogs = await db.select().from(interactions)
            .orderBy(desc(interactions.createdAt))
            .limit(30);

        const techLogs = await db.select().from(whatsappLogs)
            .orderBy(desc(whatsappLogs.createdAt))
            .limit(20);

        // Map them to a unified format for the diagnostic UI
        const mappedInteractions = interactionLogs.map(log => ({
            id: log.id,
            origin: 'interaction',
            type: log.type,
            direction: log.direction,
            content: log.content,
            createdAt: log.createdAt,
            performedAt: log.performedAt,
            metadata: log.metadata
        }));

        const mappedTech = techLogs.map(log => ({
            id: log.id,
            origin: 'tech_log',
            type: 'whatsapp',
            direction: 'unknown',
            content: `[${log.trigger}] ${log.content}`,
            createdAt: log.createdAt,
            metadata: log.metadata
        }));

        // Combine and sort by date descending
        const combined = [...mappedInteractions, ...mappedTech].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ success: true, logs: combined });
    } catch (error: any) {
        console.error('❌ Diagnostic History Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message,
            tip: "Asegúrate de que las tablas existan en Supabase."
        }, { status: 500 });
    }
}
