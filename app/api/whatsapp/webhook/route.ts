import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

// VERIFICATION (GET)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// INCOMING MESSAGES (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp Status Update (ignore for now to reduce noise)
        if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
            return NextResponse.json({ status: 'ignored_status_update' });
        }

        // Handle Messages
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Phone number
                const text = message.text?.body || '[Multimedia/No text]';
                const type = message.type;
                const timestamp = new Date();

                console.log(`📩 Incoming WhatsApp from ${from}: ${text}`);

                // 1. Identify Sender (Contact or Discovery Lead)
                let contactId = null;
                let discoveryLeadId = null;

                // Normalize phone (remove 593 or +) usually Meta sends raw country code
                // Our DB stores simple numbers or with 593. Let's try exact match first

                // Try finding in Contacts
                const [foundContact] = await db.select().from(contacts).where(eq(contacts.phone, from)).limit(1);

                if (foundContact) {
                    contactId = foundContact.id;
                } else {
                    // Try finding in Discovery Leads
                    // Note: In a real app we might need better phone normalization
                    const [foundLead] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, from)).limit(1);
                    if (foundLead) {
                        discoveryLeadId = foundLead.id;
                    }
                    // If not found, we could optionally create a new Lead, but for now we skip or log as unknown? 
                    // Let's create a "Ghost" lead logic later. For now, if not found, we can't attach it easily. 
                    // BUT for the user to "see" it, we need to attach it to *something*.
                    // Optimization: For now, if we can't find it, we won't insert the interaction to avoid FK errors,
                    // unless we allow nulls. The interactions schema *likely* allows nulls? 
                    // Checking previous route: it groups by contactId OR discoveryLeadId.
                }

                if (contactId || discoveryLeadId) {
                    // 2. Save Interaction
                    await db.insert(interactions).values({
                        contactId: contactId,
                        discoveryLeadId: discoveryLeadId,
                        type: 'whatsapp',
                        content: text,
                        direction: 'inbound',
                        performedAt: timestamp,
                        createdAt: timestamp
                    });
                    console.log('✅ Interaction saved to DB');
                } else {
                    console.log('⚠️ Sender not found in DB. Message skipped (Feature: Auto-create lead pending)');
                }
            }
            return NextResponse.json({ status: 'processed' });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error: any) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
