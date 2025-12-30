import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

/**
 * Endpoint for Evolution API Webhooks.
 * This ensures that EVERY message (sent or received) is logged in the CRM interactions history.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const eventType = body.event;

        console.log(`📩 [Evolution API Webhook] Event: ${eventType}`);

        // Evolution API v2 uses 'messages.upsert' for new messages
        if (eventType === 'messages.upsert') {
            const data = body.data;
            const messageData = Array.isArray(data) ? data[0] : data;
            const message = messageData.message;

            if (!message) return NextResponse.json({ success: true });

            const remoteJid = messageData.key.remoteJid;
            const fromMe = messageData.key.fromMe;

            // Extract text from various message types
            const text = message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption ||
                message.videoMessage?.caption ||
                (message.documentMessage ? `📄 Documento: ${message.documentMessage.fileName}` : null);

            if (!text) return NextResponse.json({ success: true, reason: 'No extractable text' });

            // Phone extraction (remove @s.whatsapp.net)
            const phone = remoteJid.split('@')[0];
            const last9 = phone.slice(-9);

            // 1. MATCH CONTACT (CRM Master Table)
            const [contact] = await db.select().from(contacts)
                .where(like(contacts.phone, `%${last9}`))
                .limit(1);

            if (contact) {
                console.log(`✅ Webhook Sync: Linked to Contact [${contact.id}] ${contact.contactName}`);
                await db.insert(interactions).values({
                    contactId: contact.id,
                    type: 'whatsapp',
                    direction: fromMe ? 'outbound' : 'inbound',
                    content: text,
                    performedAt: new Date(),
                });

                // PROACTIVE BRAIN: Trigger Donna Planning to react to the new context
                try {
                    const { planningEngine } = await import('@/lib/donna/services/PlanningEngine');
                    await planningEngine.generatePlanningForContact(contact.id);
                } catch (e) {
                    console.error('⚠️ Webhook: Planning Trigger Error:', e);
                }
            } else {
                // 2. FALLBACK: MATCH DISCOVERY LEAD (Cold Research)
                const [discoveryLead] = await db.select().from(discoveryLeads)
                    .where(like(discoveryLeads.telefonoPrincipal, `%${last9}`))
                    .limit(1);

                if (discoveryLead) {
                    console.log(`✅ Webhook Sync: Linked to Discovery Lead [${discoveryLead.id}] ${discoveryLead.nombreComercial}`);
                    await db.insert(interactions).values({
                        discoveryLeadId: discoveryLead.id,
                        type: 'whatsapp',
                        direction: fromMe ? 'outbound' : 'inbound',
                        content: text,
                        performedAt: new Date(),
                    });
                } else {
                    console.log(`ℹ️ Webhook Sync: Number ${phone} not found in any CRM table.`);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
