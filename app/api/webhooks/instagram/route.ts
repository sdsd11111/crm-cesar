import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Instagram Webhook Endpoint (Meta Graph API)
 */

// HANDLE VERIFICATION (GET)
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const mode = params.get('hub.mode');
    const token = params.get('hub.verify_token');
    const challenge = params.get('hub.challenge');

    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'objetivo_instagram_secret';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Instagram Webhook Verified');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

import { cortexRouter } from '@/lib/donna/services/CortexRouterService';

// HANDLE MESSAGES (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.object !== 'instagram') {
            return NextResponse.json({ error: 'Not an instagram object' }, { status: 400 });
        }

        // Meta sends updates in a specific structure
        const entry = body.entry?.[0];
        const messagingEvent = entry?.messaging?.[0];

        // 1. Skip if it's NOT a message (e.g., read receipt) or if it's from the bot itself
        if (!messagingEvent?.message || messagingEvent.message.is_echo) {
            return NextResponse.json({ ok: true });
        }

        const senderId = messagingEvent.sender.id;
        const text = messagingEvent.message.text;

        console.log(`📸 Instagram message from ${senderId}: ${text}`);

        // 2. IDEMPOTENCY CHECK
        // Use message.mid as the unique identifier for Instagram messages
        const messageId = messagingEvent.message.mid;
        if (messageId) {
            try {
                await db.execute(sql`
                    INSERT INTO "webhook_events_processed" ("provider", "external_id") 
                    VALUES ('instagram', ${String(messageId)})
                `);
            } catch (e) {
                console.warn(`[Instagram] Skipping duplicate message: ${messageId}`);
                return NextResponse.json({ ok: true });
            }
        }

        // 3. Process with Cortex Router
        // For now, we route it to the general brain
        await cortexRouter.processInput({
            text: text,
            source: 'client', // Most messages here are clients
            chatId: senderId,
            // We don't provide onReply because CortexRouter already knows how to send 
            // messages back via MessagingService if needed, OR we can implement 
            // a specific Responder here if the router doesn't route SEND intents yet.
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Instagram Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}
