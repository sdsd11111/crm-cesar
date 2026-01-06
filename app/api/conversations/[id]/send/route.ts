
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

        const result = await messagingService.send(id, message, metadata);

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
