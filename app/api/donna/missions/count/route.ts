import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loyaltyMissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const pendingMissions = await db
            .select()
            .from(loyaltyMissions)
            .where(eq(loyaltyMissions.status, 'pending'));

        return NextResponse.json({ count: pendingMissions.length });
    } catch (error) {
        console.error('Error fetching missions count:', error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
