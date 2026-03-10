
import { NextResponse } from 'next/server';
import { messagingService } from '@/lib/messaging/MessagingService';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params; // Contact ID
        const body = await request.json();
        const { message, metadata } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        // --- HANDOVER LOGIC ---
        // When a human sends a message from the CRM, pause the bot automatically
        const { db } = await import('@/lib/db');
        const { contacts } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        // Run bot pause and message send in parallel to minimize latency
        const [result] = await Promise.all([
            messagingService.send(id, message, metadata),
            db.update(contacts)
                .set({ botMode: 'paused', updatedAt: new Date() })
                .where(eq(contacts.id, id))
                .catch(err => console.error('Failed to pause bot:', err))
        ]);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
