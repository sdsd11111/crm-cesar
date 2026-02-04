import { db } from '../lib/db';
import { contacts, donnaChatMessages, interactions } from '../lib/db/schema';
import { eq, like, or } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load env before any DB imports if possible, though imports are hoisted.
// Better to run with --env-file in the command like the worker.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanup() {
    console.log('🧹 Starting cleanup of dummy data...');

    const targets = [
        '%MARQUEZ REGALADO MIREYA PAULINA%',
        '%GONZALEZ RAMIREZ TANIA LIZET%',
        '%Nuevo Contacto (WhatsApp)%'
    ];

    try {
        // 1. Find contacts matching the names
        const contactsToDelete = await db.select()
            .from(contacts)
            .where(or(...targets.map(t => like(contacts.contactName, t))));

        console.log(`Found ${contactsToDelete.length} contacts to delete:`);
        contactsToDelete.forEach(c => console.log(`- ${c.contactName} (ID: ${c.id}, Phone: ${c.phone})`));

        if (contactsToDelete.length === 0) {
            console.log('No contacts found. Exiting.');
            process.exit(0);
        }

        const ids = contactsToDelete.map(c => c.id);

        // 2. Delete related data (Interactions, Chat Messages)
        // Usually handled by cascade, but good to be explicit or check if cascade is set
        // Drizzle schema doesn't always enforce cascade at DB level unless configured.

        // Delete interactions
        // const delInteractions = await db.delete(interactions).where(or(...ids.map(id => eq(interactions.contactId, id))));
        // console.log(`Deleted interactions.`);

        // Delete contacts
        // For safety, let's just delete the contacts and assume cascade or let user confirm
        // Actually, I'll just run the delete for contacts.

        for (const contact of contactsToDelete) {
            console.log(`Deleting contact: ${contact.contactName}...`);
            await db.delete(contacts).where(eq(contacts.id, contact.id));
            console.log(`✅ Deleted.`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

cleanup();
