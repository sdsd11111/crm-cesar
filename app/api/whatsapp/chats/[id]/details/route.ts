import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, discoveryLeads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'contact' or 'discovery'

        if (!id || !type) {
            return NextResponse.json({ success: false, error: 'ID and type required' }, { status: 400 });
        }

        let data = null;
        if (type === 'contact') {
            [data] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
        } else {
            [data] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.id, id)).limit(1);
        }

        if (!data) {
            return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching entity details:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { type, ...updates } = body;

        if (!id || !type) {
            return NextResponse.json({ success: false, error: 'ID and type required' }, { status: 400 });
        }

        // Remove system-managed fields from updates
        const { id: _, createdAt, updatedAt, ...cleanUpdates } = updates;

        let result;
        if (type === 'contact') {
            result = await db.update(contacts)
                .set({ ...cleanUpdates, updatedAt: new Date() })
                .where(eq(contacts.id, id))
                .returning();
        } else {
            result = await db.update(discoveryLeads)
                .set({ ...cleanUpdates, updatedAt: new Date() })
                .where(eq(discoveryLeads.id, id))
                .returning();
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('Error updating entity details:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
