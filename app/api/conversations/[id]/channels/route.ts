
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactChannels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params; // Contact ID

        const channels = await db.select()
            .from(contactChannels)
            .where(eq(contactChannels.contactId, id));

        return NextResponse.json(channels);

    } catch (error: any) {
        console.error('Error fetching channels:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
