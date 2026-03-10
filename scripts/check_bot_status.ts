
import { db } from '../lib/db';
import { contacts, contactChannels, discoveryLeads } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    const phone = process.argv[2];
    if (!phone) {
        console.log('Please provide a phone number');
        process.exit(1);
    }

    console.log(`Checking status for ${phone}...`);

    // Check Contact Channels
    const channel = await db.select().from(contactChannels).where(eq(contactChannels.identifier, phone)).limit(1);

    if (channel.length > 0) {
        console.log('Found in Contact Channels:', channel[0]);
        const contact = await db.select().from(contacts).where(eq(contacts.id, channel[0].contactId)).limit(1);
        console.log('Associated Contact:', contact[0]);
    } else {
        console.log('Not found in Contact Channels');
    }

    // Check Discovery Leads
    const lead = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, phone)).limit(1);
    if (lead.length > 0) {
        console.log('Found in Discovery Leads:', lead[0]);
    } else {
        console.log('Not found in Discovery Leads');
    }

    process.exit(0);
}

check();
