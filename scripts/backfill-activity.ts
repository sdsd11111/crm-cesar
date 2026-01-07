
import { db } from '../lib/db';
import { contacts, interactions } from '../lib/db/schema';
import { desc, eq, isNull } from 'drizzle-orm';

async function backfill() {
    console.log('🔄 Starting backfill of lastActivityAt...');

    // 1. Get all contacts that have NULL lastActivityAt
    const targetContacts = await db.select({ id: contacts.id, phone: contacts.phone })
        .from(contacts)
        .where(isNull(contacts.lastActivityAt));

    console.log(`🔎 Found ${targetContacts.length} contacts to check.`);

    let fixed = 0;

    for (const contact of targetContacts) {
        // Find the latest interaction for this contact
        const [lastInter] = await db.select({ performedAt: interactions.performedAt })
            .from(interactions)
            .where(eq(interactions.contactId, contact.id))
            .orderBy(desc(interactions.performedAt))
            .limit(1);

        if (lastInter) {
            await db.update(contacts)
                .set({
                    lastActivityAt: lastInter.performedAt,
                    updatedAt: new Date()
                })
                .where(eq(contacts.id, contact.id));
            fixed++;
        }
    }

    console.log(`✅ Backfill complete. Fixed ${fixed} contacts.`);
    process.exit(0);
}

backfill().catch(err => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
});
