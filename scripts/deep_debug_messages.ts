import { db } from '../lib/db';
import { interactions } from '../lib/db/schema';
import { desc, like, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deepCheck() {
    console.log('🕵️ Deep checking interactions for numbers...');
    const numbers = ['593979499130', '593992748589'];

    // List recent INBOUND messages regardless of contact link
    const recent = await db.select().from(interactions)
        .where(sql`metadata->>'from' LIKE '%593%' OR metadata->>'phoneNumber' LIKE '%593%'`)
        .orderBy(desc(interactions.performedAt))
        .limit(20);

    console.log('\n--- Recent Global Inbound (Last 20) ---');
    recent.forEach(r => {
        const meta = r.metadata as any;
        const from = meta?.from || meta?.phoneNumber || 'unknown';
        console.log(`[${r.performedAt}] From: ${from} | Content: ${r.content?.substring(0, 30)}...`);
    });

    // Check specifically for the requested numbers in metadata JSON
    for (const num of numbers) {
        console.log(`\n--- Searching specific number: ${num} ---`);
        const specific = await db.select().from(interactions)
            .where(sql`metadata::text LIKE ${`%${num}%`}`)
            .orderBy(desc(interactions.performedAt))
            .limit(5);

        if (specific.length === 0) {
            console.log("❌ No interactions found with this number in metadata.");
        } else {
            specific.forEach(r => {
                console.log(`   [${r.direction}] [${r.performedAt}] ${r.content}`);
            });
        }
    }
    process.exit(0);
}

deepCheck();
