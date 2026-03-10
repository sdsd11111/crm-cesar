import { db } from '../lib/db';
import { interactions, donnaChatMessages, contacts, discoveryLeads } from '../lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

async function diagnoseWhatsAppChat() {
    const chatId = '593963882873';

    console.log('🔍 Diagnostic Report for chat_id:', chatId);
    console.log('='.repeat(80));

    // 1. Check donnaChatMessages table
    console.log('\n📊 1. Checking donnaChatMessages table...');
    const donnaMessages = await db.select()
        .from(donnaChatMessages)
        .where(eq(donnaChatMessages.chatId, chatId))
        .orderBy(desc(donnaChatMessages.messageTimestamp))
        .limit(10);

    console.log(`Found ${donnaMessages.length} messages in donnaChatMessages`);
    if (donnaMessages.length > 0) {
        console.log('Sample message:', JSON.stringify(donnaMessages[0], null, 2));
    }

    // 2. Check interactions table
    console.log('\n📊 2. Checking interactions table...');
    const interactionsByMetadata = await db.select()
        .from(interactions)
        .where(
            sql`metadata->>'phoneNumber' = ${chatId} OR metadata->'raw'->>'from' = ${chatId} OR metadata->>'chat_id' = ${chatId}`
        )
        .orderBy(desc(interactions.performedAt))
        .limit(10);

    console.log(`Found ${interactionsByMetadata.length} interactions by metadata search`);
    if (interactionsByMetadata.length > 0) {
        console.log('Sample interaction:', JSON.stringify(interactionsByMetadata[0], null, 2));
    }

    // 3. Check if there's a contact or discovery lead with this phone
    console.log('\n📊 3. Checking for associated contact/lead...');
    const contact = await db.select()
        .from(contacts)
        .where(eq(contacts.phone, chatId))
        .limit(1);

    if (contact.length > 0) {
        console.log('✅ Found contact:', contact[0].id, contact[0].contactName);
    } else {
        console.log('❌ No contact found with phone:', chatId);
    }

    const discoveryLead = await db.select()
        .from(discoveryLeads)
        .where(eq(discoveryLeads.telefonoPrincipal, chatId))
        .limit(1);

    if (discoveryLead.length > 0) {
        console.log('✅ Found discovery lead:', discoveryLead[0].id, discoveryLead[0].nombreComercial);
    } else {
        console.log('❌ No discovery lead found with phone:', chatId);
    }

    // 4. Check all WhatsApp interactions to see the pattern
    console.log('\n📊 4. Checking recent WhatsApp interactions pattern...');
    const recentWhatsApp = await db.select()
        .from(interactions)
        .where(eq(interactions.type, 'whatsapp'))
        .orderBy(desc(interactions.performedAt))
        .limit(5);

    console.log(`Found ${recentWhatsApp.length} recent WhatsApp interactions`);
    recentWhatsApp.forEach((inter, idx) => {
        console.log(`\n  [${idx + 1}] ID: ${inter.id}`);
        console.log(`      Contact ID: ${inter.contactId || 'NULL'}`);
        console.log(`      Discovery Lead ID: ${inter.discoveryLeadId || 'NULL'}`);
        console.log(`      Metadata:`, JSON.stringify(inter.metadata, null, 2));
    });

    // 5. Summary and recommendations
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(80));

    if (donnaMessages.length > 0 && interactionsByMetadata.length === 0) {
        console.log('⚠️  ISSUE: Messages exist in donnaChatMessages but NOT in interactions table');
        console.log('    This means the WhatsApp chat list API cannot find them.');
        console.log('    The chat list API only queries the interactions table.');
    }

    if (contact.length === 0 && discoveryLead.length === 0) {
        console.log('⚠️  ISSUE: No contact or discovery lead associated with this phone number');
        console.log('    The chat will appear as a "ghost chat" with the phone number as identifier.');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (donnaMessages.length > 0 && interactionsByMetadata.length === 0) {
        console.log('1. The message worker should save messages to BOTH tables:');
        console.log('   - donnaChatMessages (for chat history)');
        console.log('   - interactions (for the chat list)');
        console.log('2. OR: Update the chat list API to also query donnaChatMessages');
    }

    if (contact.length === 0 && discoveryLead.length === 0) {
        console.log('3. Consider creating a contact/discovery lead for this phone number');
        console.log('4. OR: Ensure the chat list API can handle "ghost chats" properly');
    }
}

diagnoseWhatsAppChat()
    .then(() => {
        console.log('\n✅ Diagnostic complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Diagnostic failed:', error);
        process.exit(1);
    });
