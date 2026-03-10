import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loyaltyMissions, contacts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const missions = await db
            .select({
                id: loyaltyMissions.id,
                content: loyaltyMissions.content,
                status: loyaltyMissions.status,
                createdAt: loyaltyMissions.createdAt,
                metadata: loyaltyMissions.metadata,
                contactName: contacts.contactName,
                businessName: contacts.businessName,
                phone: contacts.phone
            })
            .from(loyaltyMissions)
            .innerJoin(contacts, eq(loyaltyMissions.contactId, contacts.id))
            .where(eq(loyaltyMissions.status, 'pending'))
            .orderBy(sql`${loyaltyMissions.createdAt} DESC`);

        return NextResponse.json({ success: true, missions });
    } catch (error: any) {
        console.error('❌ API Missions Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { missionId, action, testNumber } = body;

        if (action === 'approve') {
            if (missionId === 'test-direct') {
                const missionContent = body.contentOverride || 'Test Directo 🦁';
                const targetPhone = testNumber;
                if (!targetPhone) return NextResponse.json({ success: false, error: 'No phone number for test' });

                const result = await whatsappService.sendMessage(targetPhone, missionContent, {
                    type: 'manual_test',
                    approvedBy: 'Cesar/Manual'
                });
                return NextResponse.json({ success: result.success, error: result.error });
            }

            // Normal mission: Just mark as approved. 
            // The Orchestrator will pick it up following antiban rules.
            await db.update(loyaltyMissions)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(loyaltyMissions.id, missionId));

            // Hybrid Mode: Trigger Orchestrator immediately for testing/production without external cron
            // Derive base URL from current request to work in any environment
            const url = new URL(req.url);
            const baseUrl = `${url.protocol}//${url.host}`;

            // Fire and forget - don't await strictly for response time
            fetch(`${baseUrl}/api/cron/notifications`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
            }).catch(e => console.error('Error triggering orchestrator:', e));

            return NextResponse.json({ success: true, message: 'Mission approved. Dispatch triggered immediately.' });
        }

        if (action === 'reject') {
            await db.update(loyaltyMissions)
                .set({ status: 'rejected', updatedAt: new Date() })
                .where(eq(loyaltyMissions.id, missionId));
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
