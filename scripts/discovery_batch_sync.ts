import { db } from '../lib/db';
import { interactions, discoveryLeads } from '../lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function syncDiscoveryLeads() {
    try {
        console.log('🌙 Starting Nightly Discovery Sync...');

        // 1. Get interactions from the last 24 hours
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const recentInteractions = await db.select()
            .from(interactions)
            .where(and(
                eq(interactions.direction, 'inbound'),
                gte(interactions.performedAt, yesterday)
            ));

        // Group by contactId/discoveryLeadId
        const conversations = new Map<string, string[]>();
        for (const inter of recentInteractions) {
            const key = inter.contactId || inter.discoveryLeadId || inter.metadata?.phoneNumber || 'unknown';
            if (!conversations.has(key)) conversations.set(key, []);
            conversations.get(key)!.push(inter.content || '');
        }

        console.log(`🧐 Analyzing ${conversations.size} conversations for lead data...`);

        for (const [id, messages] of conversations.entries()) {
            const chatLog = messages.join('\n');

            // Call AI to extract data
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Extract lead information from the following chat log. Return ONLY a JSON object with: { nombreComercial, telefonoPrincipal, personaContacto, ciudad, actividad }. If information is missing, use null.' },
                    { role: 'user', content: chatLog }
                ],
                response_format: { type: 'json_object' }
            });

            const data = JSON.parse(response.choices[0].message.content || '{}');

            if (data.nombreComercial) {
                console.log(`✨ Extracted data for lead: ${data.nombreComercial}`);

                // Upsert to discoveryLeads
                await db.insert(discoveryLeads).values({
                    nombreComercial: data.nombreComercial,
                    telefonoPrincipal: data.telefonoPrincipal || id,
                    personaContacto: data.personaContacto,
                    canton: data.ciudad,
                    actividadModalidad: data.actividad,
                    status: 'investigated',
                    updatedAt: new Date()
                }).onConflictDoUpdate({
                    target: [discoveryLeads.nombreComercial], // Assuming unique on nombreComercial or similar
                    set: {
                        personaContacto: data.personaContacto || sql`${discoveryLeads.personaContacto}`,
                        canton: data.ciudad || sql`${discoveryLeads.canton}`,
                        actividadModalidad: data.actividad || sql`${discoveryLeads.actividadModalidad}`,
                        updatedAt: new Date()
                    }
                });
            }
        }

        console.log('✅ Nightly sync completed.');
    } catch (error) {
        console.error('Sync Error:', error);
    }
}

// Run the sync
syncDiscoveryLeads().then(() => process.exit(0));
