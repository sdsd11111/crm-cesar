import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        const messages = await db.select()
            .from(interactions)
            .where(
                or(
                    eq(interactions.contactId, id),
                    eq(interactions.discoveryLeadId, id)
                )
            )
            .orderBy(desc(interactions.performedAt))
            .limit(50);

        return NextResponse.json({ success: true, messages: messages.reverse() });
    } catch (error: any) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
