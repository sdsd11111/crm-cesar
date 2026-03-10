
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params; // Contact ID
        const body = await request.json();
        const { clientId } = body;

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
        }

        // Update the contact with the client_id
        await db.update(contacts)
            .set({ clientId: clientId } as any) // Type cast until schema types fully reload
            .where(eq(contacts.id, id));

        return NextResponse.json({ success: true, message: 'Identity linked successfully' });

    } catch (error: any) {
        console.error('Error linking identity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
