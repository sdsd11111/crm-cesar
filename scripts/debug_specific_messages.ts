import { db } from '../lib/db';
import { contacts, pendingMessagesQueue, interactions } from '../lib/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkStatus() {
    console.log('🔍 Checking status for numbers: 593979499130, 593992748589');

    const numbers = ['%593979499130%', '%593992748589%'];

    for (const num of numbers) {
        console.log(`\n--- Checking ${num.replace(/%/g, '')} ---`);

        // 1. Check Contact Status & Bot Mode
        const contact = await db.select().from(contacts).where(like(contacts.phone, num)).limit(1);
        if (contact.length > 0) {
            console.log(`✅ Contact Found: ${contact[0].contactName}`);
            console.log(`   Bot Mode: ${contact[0].botMode}`);
            console.log(`   ID: ${contact[0].id}`);
        } else {
            console.log(`⚠️ Contact NOT found in DB.`);
        }

        // 2. Check Pending Queue
        const pending = await db.select().from(pendingMessagesQueue).where(like(pendingMessagesQueue.chatId, num));
        console.log(`📬 Pending Messages: ${pending.length}`);
        pending.forEach(p => console.log(`   - [${p.receivedAt}] ${p.content}`));

        // 3. Check Last Interaction (Outbound)
        let relatedId = contact[0]?.id;
        if (relatedId) {
            const lastInt = await db.select().from(interactions)
                .where(eq(interactions.contactId, relatedId))
                .orderBy(desc(interactions.performedAt))
                .limit(3);

            console.log(`🗣️ Last 3 Interactions:`);
            lastInt.forEach(i => console.log(`   - [${i.direction}] [${i.performedAt}] ${i.content?.substring(0, 50)}...`));
        }
    }
    process.exit(0);
}

checkStatus();
