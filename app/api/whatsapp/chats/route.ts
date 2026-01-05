import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Obtenemos las últimas interacciones de los últimos 7 días para agrupar por chat
        // En un escenario real, agruparíamos por contactId y tomaríamos el último mensaje
        const latestInteractions = await db.select({
            id: interactions.id,
            contactId: interactions.contactId,
            discoveryLeadId: interactions.discoveryLeadId,
            content: interactions.content,
            direction: interactions.direction,
            performedAt: interactions.performedAt,
            type: interactions.type,
        })
            .from(interactions)
            .orderBy(desc(interactions.performedAt))
            .limit(100);

        // Agrupación manual por conversación única (simplificada para el MVP)
        const uniqueChats: any[] = [];
        const seenIds = new Set();

        for (const inter of latestInteractions) {
            const key = inter.contactId || inter.discoveryLeadId;
            if (!key || seenIds.has(key)) continue;
            seenIds.add(key);

            // Buscar datos del contacto/lead
            let details: any = { name: 'Desconocido', city: '', debts: 0 };
            if (inter.contactId) {
                const [c] = await db.select().from(contacts).where(eq(contacts.id, inter.contactId)).limit(1);
                details = {
                    name: c?.contactName || 'Desconocido',
                    city: c?.city || '',
                    debts: c?.contractValue || 0
                };
            } else if (inter.discoveryLeadId) {
                const [d] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.id, inter.discoveryLeadId)).limit(1);
                details = {
                    name: d?.nombreComercial || 'Desconocido',
                    city: d?.canton || '',
                    debts: 0
                };
            }

            // Lógica de Estado Avanzada
            let status = 'inbox';
            const contentNormalized = (inter.content || '').toLowerCase();

            // 1. ¿Es Urgente? (Palabras calientes o enojo)
            const hotWords = ['precio', 'comprar', 'interesado', 'costo', 'pagar', 'urgente', 'mal', 'ayuda'];
            const isHot = hotWords.some(word => contentNormalized.includes(word));

            if (isHot && inter.direction === 'inbound') {
                status = 'urgent';
            } else if (inter.direction === 'outbound' && contentNormalized.includes('donna:')) {
                // 2. ¿Donna está trabajando?
                status = 'donna';
            } else if (inter.direction === 'inbound') {
                // 3. ¿Es solo entrada nueva?
                status = 'inbox';
            }

            let entityType = inter.contactId ? 'contact' : 'discovery';
            let phone = '';
            if (inter.contactId) {
                const [c] = await db.select().from(contacts).where(eq(contacts.id, inter.contactId)).limit(1);
                phone = c?.phone || '';
            } else if (inter.discoveryLeadId) {
                const [d] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.id, inter.discoveryLeadId)).limit(1);
                phone = d?.telefonoPrincipal || '';
            }

            uniqueChats.push({
                id: key, // Use entityId as main id
                entityId: key,
                entityType: entityType,
                contactName: details.name,
                phone: phone, // CRITICAL: Added so the frontend can reply
                city: details.city,
                debts: details.debts,
                lastMessage: inter.content || '',
                status: status,
                time: inter.performedAt,
                messageType: inter.type,
                unread: inter.direction === 'inbound'
            });
        }

        return NextResponse.json({ success: true, chats: uniqueChats });
    } catch (error: any) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
