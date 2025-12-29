export async function GET() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Total messages sent/failed in last 30 days
        // Using COALESCE to ensure we always get a number
        const [sentResult, failedResult] = await Promise.all([
            db
                .select({ count: sql<number>`COALESCE(count(*), 0)` })
                .from(whatsappLogs)
                .where(sql`${whatsappLogs.status} = 'sent' AND ${whatsappLogs.sentAt} >= ${thirtyDaysAgo}`)
                .limit(1),
            db
                .select({ count: sql<number>`COALESCE(count(*), 0)` })
                .from(whatsappLogs)
                .where(sql`${whatsappLogs.status} = 'failed' AND ${whatsappLogs.sentAt} >= ${thirtyDaysAgo}`)
                .limit(1)
        ]);

        const totalSent = Number(sentResult[0]?.count || 0);
        const totalFailed = Number(failedResult[0]?.count || 0);
        const successRate = totalSent + totalFailed > 0
            ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
            : 100;

        // Last 7 days trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await db
            .select({
                date: sql<string>`DATE(${whatsappLogs.sentAt})`,
                count: sql<number>`COALESCE(count(*), 0)`
            })
            .from(whatsappLogs)
            .where(sql`${whatsappLogs.status} = 'sent' AND ${whatsappLogs.sentAt} >= ${sevenDaysAgo}`)
            .groupBy(sql`DATE(${whatsappLogs.sentAt})`)
            .orderBy(sql`DATE(${whatsappLogs.sentAt})`)
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
