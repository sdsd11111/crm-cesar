import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, loyaltyMissions } from '@/lib/db/schema';
import { sql, eq, and, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Total messages sent in last 30 days (from interactions table)
        // Note: We count all outbound WhatsApp interactions as "sent" since they only exist if successful
        // Failed sends don't create interaction records
        const [sentResult] = await db
            .select({ count: sql<number>`COALESCE(count(*), 0)` })
            .from(interactions)
            .where(and(
                eq(interactions.type, 'whatsapp'),
                eq(interactions.direction, 'outbound'),
                gte(interactions.performedAt, thirtyDaysAgo)
            ))
            .limit(1);

        const totalSent = Number(sentResult?.count || 0);
        const totalFailed = 0; // No longer tracking failures separately
        const successRate = 100; // All logged interactions are successful

        // Last 7 days trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await db
            .select({
                date: sql<string>`DATE(${interactions.performedAt})`,
                count: sql<number>`COALESCE(count(*), 0)`
            })
            .from(interactions)
            .where(and(
                eq(interactions.type, 'whatsapp'),
                eq(interactions.direction, 'outbound'),
                gte(interactions.performedAt, sevenDaysAgo)
            ))
            .groupBy(sql`DATE(${interactions.performedAt})`)
            .orderBy(sql`DATE(${interactions.performedAt})`)
            .limit(7); // Safety limit

        // Campaign breakdown by type
        const campaignStats = await db
            .select({
                type: sql<string>`COALESCE(${loyaltyMissions.metadata}->>'type', 'unknown')`,
                count: sql<number>`COALESCE(count(*), 0)`
            })
            .from(loyaltyMissions)
            .where(eq(loyaltyMissions.status, 'executed'))
            .groupBy(sql`${loyaltyMissions.metadata}->>'type'`)
            .limit(20); // Safety limit

        return NextResponse.json({
            totalSent,
            totalFailed,
            successRate,
            last7Days: dailyStats.map(d => ({
                date: d.date || new Date().toISOString().split('T')[0],
                count: Number(d.count || 0)
            })),
            campaignBreakdown: campaignStats.map(c => ({
                type: c.type || 'unknown',
                count: Number(c.count || 0)
            }))
        });
    } catch (error) {
        console.error('Error fetching macro stats:', error);

        // Return safe defaults instead of 500 to prevent UI breaking
        return NextResponse.json({
            totalSent: 0,
            totalFailed: 0,
            successRate: 100,
            last7Days: [],
            campaignBreakdown: [],
            error: 'Failed to fetch statistics'
        }, { status: 200 }); // Return 200 with error flag instead of 500
    }
}
