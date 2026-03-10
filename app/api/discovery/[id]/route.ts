import { db } from '@/lib/db';
import { discoveryLeads } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// PATCH - Update discovery lead fields
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Remove unwanted fields from update
        const { id, createdAt, updatedAt, ...updateData } = body;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const [updated] = await db
            .update(discoveryLeads)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(discoveryLeads.id, params.id))
            .returning();

        return NextResponse.json({ success: true, discoveryLead: updated });
    } catch (error) {
        console.error('Error updating discovery lead:', error);
        return NextResponse.json(
            { error: 'Failed to update discovery lead' },
            { status: 500 }
        );
    }
}
