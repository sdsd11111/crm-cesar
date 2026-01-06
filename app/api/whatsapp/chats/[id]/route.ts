import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { eq, or, desc, sql } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        // El ID puede ser un UUID de contacto/lead O un número de teléfono (para chats fantasma)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let messages;

        if (isUUID) {
            messages = await db.select()
                .from(interactions)
                .where(
                    or(
                        eq(interactions.contactId, id),
                        eq(interactions.discoveryLeadId, id)
                    )
                )
                .orderBy(desc(interactions.performedAt))
                .limit(100);
        } else {
            // Si no es UUID, buscamos por número de teléfono en la metadata
            // Ojo: Usamos el cast a jsonb para buscar dentro de metadata
            messages = await db.select()
                .from(interactions)
                .where(
                    sql`metadata->>'phoneNumber' = ${id} OR metadata->'raw'->>'from' = ${id}`
                )
                .orderBy(desc(interactions.performedAt))
                .limit(100);
        }

        return NextResponse.json({ success: true, messages: messages.reverse() });
    } catch (error: any) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
