import { db } from '@/lib/db';
import { discoveryLeads, leads, contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const leadId = params.id;

        // 1. Fetch the discovery lead data
        const discoveryLead = await db.query.discoveryLeads.findFirst({
            where: eq(discoveryLeads.id, leadId),
        });

        if (!discoveryLead) {
            return NextResponse.json({ success: false, error: 'Discovery lead not found' }, { status: 404 });
        }

        // 2. Insert into unified contacts table
        const [newContact] = await db.insert(contacts).values({
            entityType: 'lead',
            businessName: discoveryLead.nombreComercial,
            contactName: discoveryLead.personaContacto || discoveryLead.representanteLegal || 'Desconocido',
            phone: discoveryLead.telefonoPrincipal,
            email: discoveryLead.correoElectronico,
            city: discoveryLead.canton,
            address: discoveryLead.direccion,
            businessType: discoveryLead.clasificacion || discoveryLead.tipoLocal || discoveryLead.actividadModalidad,
            notes: discoveryLead.investigacion || '', // Use legacy investigacion for notes
            researchData: discoveryLead.researchData, // ✅ STORE CONSOLIDATED JSON
            source: 'discovery',
            status: 'sin_contacto',
            discoveryLeadId: discoveryLead.id, // THE GHOST ID
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any).returning();

        // 2.5 Initialize Agent
        try {
            const { agentService } = await import('@/lib/donna/services/AgentService');
            await agentService.ensureAgent(newContact.id);
        } catch (e) {
            console.error('⚠️ DiscoveryConvert: Error initializing agent:', e);
        }

        // 3. Update discovery lead status
        await db.update(discoveryLeads).set({
            status: 'converted',
            updatedAt: new Date(),
        }).where(eq(discoveryLeads.id, leadId));

        return NextResponse.json({ success: true, lead: newContact });
    } catch (error) {
        console.error('Error converting discovery lead:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
