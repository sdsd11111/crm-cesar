import { db } from '../lib/db';
import { contacts, interactions } from '../lib/db/schema';
import { eq, like, desc, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixContacts() {
    console.log('🔧 Fixing contacts for manual attention...');

    // Using the numbers provided by user (ensure they have country code if needed)
    // The user wrote 0992748589, implying 593992748589
    // And 593979499130

    const targets = [
        { phone: '593992748589', name: 'Cristina (Manual Fix)' },
        { phone: '593979499130', name: 'Usuario (Manual Fix)' }
    ];

    for (const t of targets) {
        console.log(`\nProcessing ${t.phone}...`);

        // 1. Check if exists
        const existing = await db.select().from(contacts).where(like(contacts.phone, `%${t.phone}%`));

        if (existing.length > 0) {
            console.log(`✅ Contact already exists: ${existing[0].contactName} (ID: ${existing[0].id})`);
            // Force pause if user wants to attend directly
            await db.update(contacts)
                .set({ botMode: 'paused' })
                .where(eq(contacts.id, existing[0].id));
            console.log(`   ⏸️  Bot PAUSED for this contact.`);
        } else {
            console.log(`⚠️ Contact missing. Creating...`);

            // Create contact
            const [newContact] = await db.insert(contacts).values({
                contactName: t.name,
                businessName: t.name, // Required field
                phone: t.phone,
                botMode: 'paused', // Paused so user can attend
                status: 'lead',
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            console.log(`   ✨ Created contact ID: ${newContact.id}`);

            // Link existing interactions to this new contact
            const result = await db.update(interactions)
                .set({ contactId: newContact.id })
                .where(sql`metadata->>'from' LIKE ${`%${t.phone}%`} OR metadata->>'phoneNumber' LIKE ${`%${t.phone}%`}`); // Simplified query

            // Note: The generic update result in Drizzle might not show rowCount easily depending on driver, 
            // but we'll try to log what we can.
            console.log(`   🔗 Linked historical interactions to new contact.`);
        }
    }
    process.exit(0);
}

fixContacts();
