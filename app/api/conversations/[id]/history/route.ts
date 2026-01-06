
import { NextResponse } from 'next/server';
import { messagingService } from '@/lib/messaging/MessagingService';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params; // Contact ID

        const history = await messagingService.getUnifiedHistory(id);

        return NextResponse.json(history);

    } catch (error: any) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
