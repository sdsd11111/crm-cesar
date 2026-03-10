import { db } from './lib/db';
import { leads, contacts } from './lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function migrateOrphanedLeads() {
    console.log('🔍 Buscando leads huérfanos en la tabla legacy...');

    const orphanedLeads = await db.select().from(leads).where(eq(leads.source, 'discovery'));

    if (orphanedLeads.length === 0) {
        console.log('✅ No se encontraron leads huérfanos para migrar.');
        return;
    }

    console.log(`📦 Encontrados ${orphanedLeads.length} leads. Iniciando migración a tabla 'contacts'...`);

    for (const lead of orphanedLeads) {
        try {
            // Check if already exists in contacts by business name (simple check)
            const [existing] = await db.select().from(contacts).where(
                and(
                    eq(contacts.businessName, lead.businessName),
                    eq(contacts.entityType, 'lead')
                )
            ).limit(1);

            if (existing) {
                console.log(`⏭️ Ignorando "${lead.businessName}" (ya existe en contacts)`);
                continue;
            }

            const contactData = {
                entityType: 'lead' as const,
                businessName: lead.businessName,
                contactName: lead.contactName,
                phone: lead.phone,
                email: lead.email,
                city: lead.city,
                address: lead.address,
                businessType: lead.businessType,
                connectionType: lead.connectionType,
                businessActivity: lead.businessActivity,
                interestedProduct: lead.interestedProduct,
                verbalAgreements: lead.verbalAgreements,
                personalityType: lead.personalityType,
                communicationStyle: lead.communicationStyle,
                keyPhrases: lead.keyPhrases,
                strengths: lead.strengths,
                weaknesses: lead.weaknesses,
                opportunities: lead.opportunities,
                threats: lead.threats,
                relationshipType: lead.relationshipType,
                quantifiedProblem: lead.quantifiedProblem,
                conservativeGoal: lead.conservativeGoal,
                yearsInBusiness: lead.yearsInBusiness,
                numberOfEmployees: lead.numberOfEmployees,
                numberOfBranches: lead.numberOfBranches,
                currentClientsPerMonth: lead.currentClientsPerMonth,
                averageTicket: lead.averageTicket,
                knownCompetition: lead.knownCompetition,
                highSeason: lead.highSeason,
                criticalDates: lead.criticalDates,
                facebookFollowers: lead.facebookFollowers,
                otherAchievements: lead.otherAchievements,
                specificRecognitions: lead.specificRecognitions,
                files: lead.files,
                audioTranscriptions: lead.audioTranscriptions,
                status: lead.status,
                phase: lead.phase,
                notes: lead.notes,
                source: lead.source,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
            };

            const [newContact] = await db.insert(contacts).values(contactData).returning();
            console.log(`✅ Migrado: "${lead.businessName}" (ID: ${newContact.id})`);

        } catch (error) {
            console.error(`❌ Error migrando "${lead.businessName}":`, error);
        }
    }

    console.log('🏁 Migración finalizada.');
}

migrateOrphanedLeads().catch(console.error);
