import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/db';
import { contacts, contactChannels } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

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

    // Helper to normalize empty strings to null
    const n = (val: any) => (val === "" || val === undefined) ? null : val;

    // Map body fields to Drizzle schema keys (CamelCase)
    // We only map fields that are provided to avoid overwriting existing data with nulls accidentally in future selective updates
    // But for current form logic, we map the expected set.
    const drizzleBody: any = {
      businessName: n(body.businessName),
      contactName: n(body.contactName),
      phone: n(body.phone),
      email: n(body.email),
      address: n(body.address),
      city: n(body.city),
      province: n(body.province),
      businessType: n(body.businessType),
      connectionType: n(body.relationshipType),
      businessActivity: n(body.businessActivity),
      interestedProduct: Array.isArray(body.interestedProduct) ? body.interestedProduct.join(', ') : n(body.interestedProduct),
      verbalAgreements: n(body.verbalAgreements),
      personalityType: n(body.personalityType),
      communicationStyle: n(body.communicationStyle),
      keyPhrases: n(body.keyPhrases),

      pains: n(body.pains),
      goals: n(body.goals),
      objections: n(body.objections),

      strengths: n(body.strengths),
      weaknesses: n(body.weaknesses),
      opportunities: n(body.opportunities),
      threats: n(body.threats),

      quantifiedProblem: n(body.quantifiedProblem),
      conservativeGoal: n(body.conservativeGoal),
      yearsInBusiness: body.yearsInBusiness ? parseInt(body.yearsInBusiness) : null,
      numberOfEmployees: body.numberOfEmployees ? parseInt(body.numberOfEmployees) : null,
      numberOfBranches: body.numberOfBranches ? parseInt(body.numberOfBranches) : null,
      currentClientsPerMonth: body.currentClientsPerMonth ? parseInt(body.currentClientsPerMonth) : null,
      averageTicket: body.averageTicket ? parseInt(body.averageTicket) : null,

      // Date handling
      birthday: body.birthday ? new Date(body.birthday) : null,
      anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate) : null,

      knownCompetition: n(body.knownCompetition),
      highSeason: n(body.highSeason),
      criticalDates: n(body.criticalDates),
      facebookFollowers: body.facebookFollowers ? parseInt(body.facebookFollowers) : null,
      otherAchievements: n(body.otherAchievements),
      specificRecognitions: n(body.specificRecognitions),

      notes: n(body.notes),
      source: body.source || 'recorridos',
      status: body.status || 'sin_contacto',
      outreachStatus: body.outreachStatus || 'new',
      discoveryLeadId: n(body.discoveryLeadId),
      entityType: 'lead'
    };

    // 1. Deduplication & Identity Resolution
    let contactId = null;

    if (body.phone) {
      const cleanPhone = body.phone.replace(/\D/g, '');

      // A. Check Channels
      const [channelMatch] = await db.select().from(contactChannels)
        .where(or(
          eq(contactChannels.identifier, body.phone),
          eq(contactChannels.identifier, cleanPhone)
        ))
        .limit(1);

      if (channelMatch) {
        contactId = channelMatch.contactId;
      } else {
        // B. Check Legacy Contacts table
        const [legacyMatch] = await db.select().from(contacts)
          .where(or(
            eq(contacts.phone, body.phone),
            eq(contacts.phone, cleanPhone)
          ))
          .limit(1);

        if (legacyMatch) {
          contactId = legacyMatch.id;
          // Auto-heal later
        }
      }
    }

    if (!contactId && body.email) {
      const [emailMatch] = await db.select().from(contacts)
        .where(eq(contacts.email, body.email))
        .limit(1);
      if (emailMatch) contactId = emailMatch.id;
    }

    let finalResult;

    if (contactId) {
      // UPDATE
      drizzleBody.updatedAt = new Date();
      const [updated] = await db.update(contacts)
        .set(drizzleBody)
        .where(eq(contacts.id, contactId))
        .returning();

      finalResult = updated;

      // Auto-heal Channel
      if (body.phone) {
        try {
          const [exists] = await db.select().from(contactChannels)
            .where(and(
              eq(contactChannels.contactId, contactId),
              eq(contactChannels.identifier, body.phone)
            ))
            .limit(1);

          if (!exists) {
            await db.insert(contactChannels).values({
              contactId,
              platform: 'whatsapp',
              identifier: body.phone,
              isPrimary: true
            });
          }
        } catch (e) { /* ignore */ }
      }
    } else {
      // INSERT
      const [inserted] = await db.insert(contacts)
        .values(drizzleBody)
        .returning();

      finalResult = inserted;

      if (body.phone) {
        await db.insert(contactChannels).values({
          contactId: inserted.id,
          platform: 'whatsapp',
          identifier: body.phone,
          isPrimary: true
        });
      }
    }

    // 2. Donna Initialization
    try {
      const { agentService } = await import('@/lib/donna/services/AgentService');
      await agentService.ensureAgent(finalResult.id);
    } catch (e) {
      console.error('⚠️ LeadsAPI Agent Initialization Error:', e);
    }

    return NextResponse.json(finalResult, { status: 201 });
  } catch (error) {
    console.error("Critical Error in POST /api/leads:", error);
    return NextResponse.json({
      error: "Failed to create/update lead",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}