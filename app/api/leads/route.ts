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
      relationshipType: lead.relationship_type, // or connection_type depending on usage
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
      researchData: lead.research_data, // ✅ NEW FIELD
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

    // Check if user is authenticated (Optional but good practice)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Note: If RLS allows anon insert, we don't strictly *need* user, but highly recommended for CRM.

    const supabaseBody = {
      business_name: body.businessName,
      contact_name: body.contactName,
      phone: body.phone,
      email: body.email,
      city: body.city, // Address field usually maps here or address
      address: body.address,
      business_type: body.businessType,
      // Recorridos fields
      connection_type: body.relationshipType, // relationshipType -> connection_type
      business_activity: body.businessActivity,
      interested_product: body.interestedProduct,
      verbal_agreements: body.verbalAgreements,
      personality_type: body.personalityType,
      communication_style: body.communicationStyle,
      key_phrases: body.keyPhrases,

      // Profiling (History)
      pains: body.pains,
      goals: body.goals,
      objections: body.objections,

      // FODA
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      opportunities: body.opportunities,
      threats: body.threats,

      // Advanced
      quantified_problem: body.quantified_problem,
      conservative_goal: body.conservative_goal,
      years_in_business: body.yearsInBusiness ? parseInt(body.yearsInBusiness) : null,
      number_of_employees: body.numberOfEmployees ? parseInt(body.numberOfEmployees) : null,
      number_of_branches: body.numberOfBranches ? parseInt(body.numberOfBranches) : null,
      current_clients_per_month: body.current_clients_per_month ? parseInt(body.currentClientsPerMonth) : null,
      average_ticket: body.average_ticket ? parseInt(body.averageTicket) : null,
      birthday: body.birthday || null,
      anniversary_date: body.anniversary_date || null,

      known_competition: body.knownCompetition,
      high_season: body.highSeason,
      critical_dates: body.criticalDates,
      facebook_followers: body.facebookFollowers ? parseInt(body.facebookFollowers) : null,
      other_achievements: body.otherAchievements,
      specific_recognitions: body.specificRecognitions,

      notes: body.notes,
      source: body.source || 'recorridos',
      status: body.status || 'sin_contacto',
      outreach_status: 'new',
      discovery_lead_id: body.discoveryLeadId || null
    };

    // Remove undefined keys
    Object.keys(supabaseBody).forEach(key =>
      (supabaseBody as any)[key] === undefined && delete (supabaseBody as any)[key]
    );

    // 1. Anti-Duplicate Check
    let contactId = null;

    // A. Check by Phone (via Channels or Legacy Table)
    if (body.phone) {
      // Strategy 1: Check new Channels table
      const [channel] = await db.select().from(contactChannels)
        .where(or(
          eq(contactChannels.identifier, body.phone),
          eq(contactChannels.identifier, body.phone.replace(/\D/g, ''))
        ))
        .limit(1);

      if (channel) {
        contactId = channel.contactId;
        console.log(`Lead Deduplication: Found existing contact via Channel ${body.phone}`);
      } else {
        // Strategy 2: Check legacy Contacts table (Critical for migration)
        const [legacyContact] = await db.select().from(contacts)
          .where(or(
            eq(contacts.phone, body.phone),
            eq(contacts.phone, body.phone.replace(/\D/g, ''))
          ))
          .limit(1);

        if (legacyContact) {
          contactId = legacyContact.id;
          console.log(`Lead Deduplication: Found legacy contact via phone ${body.phone}. Auto-healing...`);
          // Auto-heal: Link this phone to the contact in the new channels table
          try {
            await db.insert(contactChannels).values({
              contactId: legacyContact.id,
              platform: 'whatsapp',
              identifier: body.phone,
              isPrimary: true,
              verified: false
            });
          } catch (e) {
            console.warn('Auto-heal insert failed (might already exist):', e);
          }
        }
      }
    }

    // B. Check by Email (if no phone match)
    if (!contactId && body.email) {
      const [contact] = await db.select().from(contacts)
        .where(eq(contacts.email, body.email))
        .limit(1);

      if (contact) {
        contactId = contact.id;
        console.log(`Lead Deduplication: Found existing contact via Email ${body.email}`);
      }
    }

    let newLead;

    if (contactId) {
      // UPDATE EXISTING
      const [updatedLead] = await db.update(contacts)
        .set({
          ...supabaseBody, // Updates with new info from form
          updatedAt: new Date(),
          status: 'sin_contacto' // Ensure it reappears in pipeline
        } as any)
        .where(eq(contacts.id, contactId))
        .returning();

      newLead = updatedLead;

    } else {
      // INSERT NEW
      const [insertedLead] = await db.insert(contacts)
        .values({ ...supabaseBody, entityType: 'lead' } as any)
        .returning();

      newLead = insertedLead;
      contactId = insertedLead.id;

      // Create Channel Entry for the new phone
      if (body.phone) {
        await db.insert(contactChannels).values({
          contactId: contactId,
          platform: 'whatsapp', // Default assumption for form phones
          identifier: body.phone,
          isPrimary: true,
          verified: false
        });
      }
    }

    // 2. Initialize Agent
    try {
      const { agentService } = await import('@/lib/donna/services/AgentService');
      await agentService.ensureAgent(newLead.id);
    } catch (e) {
      console.error('⚠️ LeadsAPI: Error initializing agent:', e);
    }

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/leads:", error);
    return NextResponse.json({ error: "Failed to create lead", details: (error as Error).message }, { status: 500 });
  }
}