import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/db';
import { contacts, contactChannels } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    const { data: allLeads, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('entity_type', 'lead')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend
    const mappedLeads = allLeads?.map(lead => ({
      id: lead.id,
      businessName: lead.business_name,
      contactName: lead.contact_name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      connectionType: lead.connection_type,
      businessActivity: lead.business_activity,
      interestedProduct: lead.interested_product,
      verbalAgreements: lead.verbal_agreements,
      pains: lead.pains,
      goals: lead.goals,
      objections: lead.objections,
      quantifiedProblem: lead.quantified_problem,
      conservativeGoal: lead.conservative_goal,
      personalityType: lead.personality_type,
      communicationStyle: lead.communication_style,
      keyPhrases: lead.key_phrases,
      strengths: lead.strengths,
      weaknesses: lead.weaknesses,
      opportunities: lead.opportunities,
      threats: lead.threats,

      // Advanced fields
      relationshipType: lead.relationship_type,
      yearsInBusiness: lead.years_in_business,
      numberOfEmployees: lead.number_of_employees,
      numberOfBranches: lead.number_of_branches,
      currentClientsPerMonth: lead.current_clients_per_month,
      averageTicket: lead.average_ticket,
      birthday: lead.birthday,
      anniversaryDate: lead.anniversary_date,
      knownCompetition: lead.known_competition,
      highSeason: lead.high_season,
      criticalDates: lead.critical_dates,
      facebookFollowers: lead.facebook_followers,
      otherAchievements: lead.other_achievements,
      specificRecognitions: lead.specific_recognitions,

      status: lead.status,
      phase: lead.phase,
      createdAt: lead.created_at,
      source: lead.source,
      notes: lead.notes,
      investigacion: lead.investigacion,
      researchData: lead.research_data,
      quotation: lead.quotation
    })) || [];

    return NextResponse.json(mappedLeads, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/leads:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    const body = await request.json();

    // Map body fields to Drizzle schema keys (CamelCase)
    const drizzleBody: any = {
      businessName: body.businessName,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      city: body.city,
      businessType: body.businessType,
      connectionType: body.relationshipType, // relationshipType maps to connectionType in recorridos
      businessActivity: body.businessActivity,
      // Handle array fields
      interestedProduct: Array.isArray(body.interestedProduct) ? body.interestedProduct.join(', ') : body.interestedProduct,
      verbalAgreements: body.verbalAgreements,
      personalityType: body.personalityType,
      communicationStyle: body.communicationStyle,
      keyPhrases: body.keyPhrases,

      // Profiling
      pains: body.pains,
      goals: body.goals,
      objections: body.objections,

      // FODA
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      opportunities: body.opportunities,
      threats: body.threats,

      // Metrics
      quantifiedProblem: body.quantifiedProblem,
      conservativeGoal: body.conservativeGoal,
      yearsInBusiness: body.yearsInBusiness ? parseInt(body.yearsInBusiness) : null,
      numberOfEmployees: body.numberOfEmployees ? parseInt(body.numberOfEmployees) : null,
      numberOfBranches: body.numberOfBranches ? parseInt(body.numberOfBranches) : null,
      currentClientsPerMonth: body.currentClientsPerMonth ? parseInt(body.currentClientsPerMonth) : null,
      averageTicket: body.averageTicket ? parseInt(body.averageTicket) : null,
      birthday: body.birthday ? new Date(body.birthday).toISOString() : null,
      anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate).toISOString() : null,

      knownCompetition: body.knownCompetition,
      highSeason: body.highSeason,
      criticalDates: body.criticalDates,
      facebookFollowers: body.facebookFollowers ? parseInt(body.facebookFollowers) : null,
      otherAchievements: body.otherAchievements,
      specificRecognitions: body.specificRecognitions,

      notes: body.notes,
      source: body.source || 'recorridos',
      status: body.status || 'sin_contacto',
      outreachStatus: 'new',
      discoveryLeadId: body.discoveryLeadId || null,
      entityType: 'lead'
    };

    // Remove undefined keys
    Object.keys(drizzleBody).forEach(key =>
      drizzleBody[key] === undefined && delete drizzleBody[key]
    );

    // 1. Deduplication Logic
    let contactId = null;

    if (body.phone) {
      // Channel Check
      const [channel] = await db.select().from(contactChannels)
        .where(or(
          eq(contactChannels.identifier, body.phone),
          eq(contactChannels.identifier, body.phone.replace(/\D/g, ''))
        ))
        .limit(1);

      if (channel) {
        contactId = channel.contactId;
      } else {
        // Legacy Check
        const [legacyContact] = await db.select().from(contacts)
          .where(or(
            eq(contacts.phone, body.phone),
            eq(contacts.phone, body.phone.replace(/\D/g, ''))
          ))
          .limit(1);

        if (legacyContact) {
          contactId = legacyContact.id;
          // Auto-heal
          try {
            await db.insert(contactChannels).values({
              contactId: legacyContact.id,
              platform: 'whatsapp',
              identifier: body.phone,
              isPrimary: true,
              verified: false
            });
          } catch (e) {
            console.warn('Auto-heal insert failed:', e);
          }
        }
      }
    }

    if (!contactId && body.email) {
      const [contactByEmail] = await db.select().from(contacts)
        .where(eq(contacts.email, body.email))
        .limit(1);
      if (contactByEmail) contactId = contactByEmail.id;
    }

    let finalLead;

    if (contactId) {
      // Update
      const [updated] = await db.update(contacts)
        .set({
          ...drizzleBody,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, contactId))
        .returning();
      finalLead = updated;
    } else {
      // Insert
      const [inserted] = await db.insert(contacts)
        .values(drizzleBody)
        .returning();
      finalLead = inserted;

      if (body.phone) {
        await db.insert(contactChannels).values({
          contactId: inserted.id,
          platform: 'whatsapp',
          identifier: body.phone,
          isPrimary: true,
          verified: false
        });
      }
    }

    // 2. Donna Biz Logic (Ensure Agent)
    try {
      const { agentService } = await import('@/lib/donna/services/AgentService');
      await agentService.ensureAgent(finalLead.id);
    } catch (e) {
      console.error('⚠️ LeadsAPI Agent Error:', e);
    }

    return NextResponse.json(finalLead, { status: 201 });
  } catch (error) {
    console.error("Critical Error POST /api/leads:", error);
    return NextResponse.json({
      error: "Failed to create/update lead",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}