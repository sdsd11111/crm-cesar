import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Obtener todas las interacciones de WhatsApp recientes
        const latestInteractions = await db.select()
            .from(interactions)
            .where(eq(interactions.type, 'whatsapp'))
            .orderBy(desc(interactions.performedAt))
            .limit(200);

        const chatsMap = new Map();

        // 2. Procesar y Agrupar
        for (const inter of latestInteractions) {
            // Un chat se identifica por: contactId, discoveryLeadId, o el numero en metadata
            const metadata = inter.metadata as any || {};
            const phoneNumber = metadata.phoneNumber || (metadata.raw?.from) || '';

            // Generar una "Key" única para el chat
            const chatKey = inter.contactId || inter.discoveryLeadId || phoneNumber;

            if (!chatKey) continue;
            if (chatsMap.has(chatKey)) continue; // Solo nos importa la más reciente

            // 3. Obtener detalles del emisor
            let details = { name: phoneNumber || 'Desconocido', phone: phoneNumber, type: 'unknown' };

            if (inter.contactId) {
                const [c] = await db.select().from(contacts).where(eq(contacts.id, inter.contactId)).limit(1);
                if (c) {
                    details = { name: c.contactName || c.businessName || phoneNumber, phone: c.phone || phoneNumber, type: 'contact' };
                }
            } else if (inter.discoveryLeadId) {
                const [d] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.id, inter.discoveryLeadId)).limit(1);
                if (d) {
                    details = { name: d.nombreComercial || phoneNumber, phone: d.telefonoPrincipal || phoneNumber, type: 'discovery' };
                }
            }

            // 4. Determinar Estado
            let status = 'inbox';
            const contentNormalized = (inter.content || '').toLowerCase();
            const hotWords = ['precio', 'comprar', 'interesado', 'costo', 'pagar', 'urgente', 'ayuda'];

            if (hotWords.some(word => contentNormalized.includes(word)) && inter.direction === 'inbound') {
                status = 'urgent';
            } else if (inter.direction === 'outbound' && contentNormalized.includes('donna:')) {
                status = 'donna';
            } else if (inter.direction === 'inbound') {
                status = 'inbox';
            }

            chatsMap.set(chatKey, {
                id: chatKey,
                entityId: inter.contactId || inter.discoveryLeadId || null,
                entityType: details.type,
                contactName: details.name,
                phone: details.phone,
                lastMessage: inter.content || '',
                status: status,
                time: inter.performedAt,
                messageType: inter.type,
                metadata: inter.metadata,
                unread: inter.direction === 'inbound',
                isGhost: !inter.contactId && !inter.discoveryLeadId
            });
        }

        const uniqueChats = Array.from(chatsMap.values());

        return NextResponse.json({ success: true, chats: uniqueChats });
    } catch (error: any) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
