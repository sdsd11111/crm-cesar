import { db } from './lib/db';
import { contacts } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
    const starContacts = [
        {
            contactName: 'César Reyes',
            businessName: 'CRM Objetivo',
            phone: '0963410409',
            categoryTags: ['star', 'admin'],
            entityType: 'client' as const
        },
        {
            contactName: 'Cristhopher Reyes',
            businessName: 'CRM Objetivo',
            phone: '0999999999', // Template placeholder
            categoryTags: ['star', 'admin'],
            entityType: 'client' as const
        },
        {
            contactName: 'Abel',
            businessName: 'CRM Objetivo',
            phone: '593967491847',
            categoryTags: ['star', 'internal'],
            entityType: 'client' as const
        }
    ];

    console.log('🌱 Seeding star contacts...');

    for (const star of starContacts) {
        // Check if exists
        const existing = await db.select().from(contacts).where(eq(contacts.phone, star.phone)).limit(1);

        if (existing.length === 0) {
            await db.insert(contacts).values(star);
            console.log(`✅ Added: ${star.contactName}`);
        } else {
            console.log(`ℹ️ Already exists: ${star.contactName}`);
        }
    }

    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
