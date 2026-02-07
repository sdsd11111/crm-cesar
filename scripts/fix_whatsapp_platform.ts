
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '@/lib/db';
import { donnaChatMessages } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
    console.log('🔄 Starting correction of platform column...');

    // Update records where metadata contains "platform": "whatsapp" but column is not "whatsapp"
    // Note: Drizzle's sql operator for JSON might vary by driver. Postgres uses ->>

    // Safety check: Select first to see count
    const toUpdate = await db.select({ count: sql<number>`count(*)` })
        .from(donnaChatMessages)
        .where(sql`metadata->>'platform' = 'whatsapp' AND platform != 'whatsapp'`);

    console.log(`📊 Found ${toUpdate[0].count} records to update.`);

    if (Number(toUpdate[0].count) > 0) {
        const result = await db.update(donnaChatMessages)
            .set({ platform: 'whatsapp' })
            .where(sql`metadata->>'platform' = 'whatsapp' AND platform != 'whatsapp'`)
            .returning({ id: donnaChatMessages.id });

        console.log(`✅ Successfully updated ${result.length} records.`);
    } else {
        console.log('✨ No records needed updating.');
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
