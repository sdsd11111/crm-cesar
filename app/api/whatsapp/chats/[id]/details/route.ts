import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, discoveryLeads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper to check if string is UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'campaign'; // Default to campaign

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        let data = null;

        // 1. Try search by UUID if applicable
        if (isUUID(id)) {
            if (type === 'contact') {
                [data] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
            } else if (type === 'discovery') {
                [data] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.id, id)).limit(1);
            }
        }

        // 2. If not found or not UUID, try search by Phone (common in campaign chats)
        if (!data) {
            // Check discovery leads first (most common for Donna)
            const [lead] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, id)).limit(1);
            if (lead) {
                data = lead;
            } else {
                // Check contacts
                const [contact] = await db.select().from(contacts).where(eq(contacts.phone, id)).limit(1);
                if (contact) {
                    data = contact;
                }
            }
        }

        // 3. If STILL not found and type is campaign, return virtual object
        if (!data && type === 'campaign') {
            data = {
                id,
                businessName: "Nuevo Lead (Campaña)",
                telefonoPrincipal: id,
                botMode: 'active',
                entityType: 'campaign'
            };
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
        const { type = 'campaign', ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        // Remove system-managed fields from updates
        const { id: _, createdAt, updatedAt, ...cleanUpdates } = updates;

        let result: any[] = [];

        // 1. If it's a UUID, try updating directly by ID
        if (isUUID(id)) {
            if (type === 'contact') {
                result = await db.update(contacts).set({ ...cleanUpdates, updatedAt: new Date() }).where(eq(contacts.id, id)).returning();
            } else if (type === 'discovery') {
                result = await db.update(discoveryLeads).set({ ...cleanUpdates, updatedAt: new Date() }).where(eq(discoveryLeads.id, id)).returning();
            }
        }

        // 2. If no result yet, maybe it's a campaign chat using phone as ID
        if (result.length === 0) {
            // Search for existing lead/contact by phone
            let [lead] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, id)).limit(1);
            if (lead) {
                result = await db.update(discoveryLeads).set({ ...cleanUpdates, updatedAt: new Date() }).where(eq(discoveryLeads.id, lead.id)).returning();
            } else {
                let [contact] = await db.select().from(contacts).where(eq(contacts.phone, id)).limit(1);
                if (contact) {
                    result = await db.update(contacts).set({ ...cleanUpdates, updatedAt: new Date() }).where(eq(contacts.id, contact.id)).returning();
                } else if (type === 'campaign') {
                    // Create a discovery lead on the fly to support botMode and basic capture
                    result = await db.insert(discoveryLeads).values({
                        telefonoPrincipal: id,
                        nombreComercial: updates.nombreComercial || updates.businessName || `Lead Campaña ${id}`,
                        botMode: updates.botMode || 'active',
                        source: 'campaign_whatsapp'
                    }).returning();
                }
            }
        }

        if (result.length === 0) {
            return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('Error updating entity details:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
