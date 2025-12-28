import { NextResponse } from 'next/server';
import { notificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Simple security check (optional, can be enhanced with CRON_SECRET)
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            console.log('❌ 401 Blocked. Env Secret:', process.env.CRON_SECRET, 'Provided:', secret);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('⏰ Cron: Triggering Daily Outreach...');
        const results = await notificationOrchestrator.executeDailyOutreach();

        return NextResponse.json({
            success: true,
            results
        });
    } catch (error: any) {
        console.error('❌ Cron Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
