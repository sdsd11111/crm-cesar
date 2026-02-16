import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod';

// Zod validation schema for lead updates (loose validation for partial updates)
const LeadUpdateSchema = z.object({
  status: z.string().optional(),
  quotation: z.string().optional(),
  businessName: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  // Add other fields as loose check or allow pass-through
}).passthrough();

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

  // audit-log: Passive security check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(`⚠️ [SECURITY AUDIT] Unauthorized access attempt to GET /api/leads/${params.id}`);
  }

  const { id } = params;

  try {
    const { data: lead, error } = await supabase
      .from('contacts')
      .select(`
        *,
        discovery_leads:discovery_lead_id (
          razon_social_propietario
        )
      `)
      .eq('id', id)
      .eq('entity_type', 'lead')
      .single();

    if (error || !lead) {
      console.error("Error fetching lead:", error);
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Map snake_case to camelCase
    const mappedLead = {
      id: lead.id,
      businessName: lead.business_name,
      contactName: lead.contact_name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      province: lead.province,
      businessType: lead.business_type,
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
      knownCompetition: lead.known_competition,
      highSeason: lead.high_season,
      criticalDates: lead.critical_dates,
      birthday: lead.birthday,
      anniversaryDate: lead.anniversary_date,
      facebookFollowers: lead.facebook_followers,
      otherAchievements: lead.other_achievements,
      specificRecognitions: lead.specific_recognitions,
      status: lead.status,
      phase: lead.phase,
      createdAt: lead.created_at,
      source: lead.source,
      notes: lead.notes,
      quotation: lead.quotation,
      discoveryLeadId: lead.discovery_lead_id,
      ownerName: lead.discovery_leads?.razon_social_propietario
    };

    // Fetch related data (interactions, tasks)
    // If the lead has a linked discovery lead, we want to fetch interactions for BOTH IDs
    const interactionsQuery = lead.discovery_lead_id
      ? supabase
        .from('interactions')
        .select('*')
        .or(`contact_id.eq.${id},discovery_lead_id.eq.${lead.discovery_lead_id}`)
        .order('performed_at', { ascending: false })
      : supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', id)
        .order('performed_at', { ascending: false });

    const [interactions, tasks] = await Promise.all([
      interactionsQuery,
      supabase.from('tasks').select('*').eq('contact_id', id).order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      lead: mappedLead,
      interactions: interactions.data || [],
      tasks: tasks.data || []
    }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/leads/[id]:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  // audit-log: Passive security check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(`⚠️ [SECURITY AUDIT] Unauthorized access attempt to PATCH /api/leads/${params.id}`);
  }

  const { id } = params;

  try {
    const body = await request.json();

    // Validate request body basic structure
    const validation = LeadUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Map camelCase body to snake_case for Supabase update
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.quotation !== undefined) updateData.quotation = body.quotation;
    if (body.status !== undefined) updateData.status = body.status;

    // Contact Info
    if (body.businessName !== undefined) updateData.business_name = body.businessName;
    if (body.contactName !== undefined) updateData.contact_name = body.contactName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.province !== undefined) updateData.province = body.province;
    if (body.businessType !== undefined) updateData.business_type = body.businessType;

    // Recorridos Fields
    if (body.relationshipType !== undefined) updateData.connection_type = body.relationshipType; // Note: map to connection_type per schema
    if (body.connectionType !== undefined) updateData.connection_type = body.connectionType; // Allow direct mapping too
    if (body.businessActivity !== undefined) updateData.business_activity = body.businessActivity;
    if (body.interestedProduct !== undefined) updateData.interested_product = body.interestedProduct;
    if (body.verbalAgreements !== undefined) updateData.verbal_agreements = body.verbalAgreements;

    // Profiling
    if (body.pains !== undefined) updateData.pains = body.pains;
    if (body.goals !== undefined) updateData.goals = body.goals;
    if (body.objections !== undefined) updateData.objections = body.objections;

    if (body.quantifiedProblem !== undefined) updateData.quantified_problem = body.quantifiedProblem;
    if (body.conservativeGoal !== undefined) updateData.conservative_goal = body.conservativeGoal;

    // Personality
    if (body.personalityType !== undefined) updateData.personality_type = body.personalityType;
    if (body.communicationStyle !== undefined) updateData.communication_style = body.communicationStyle;
    if (body.keyPhrases !== undefined) updateData.key_phrases = body.keyPhrases;

    // FODA
    if (body.strengths !== undefined) updateData.strengths = body.strengths;
    if (body.weaknesses !== undefined) updateData.weaknesses = body.weaknesses;
    if (body.opportunities !== undefined) updateData.opportunities = body.opportunities;
    if (body.threats !== undefined) updateData.threats = body.threats;

    // Numeric fields
    if (body.yearsInBusiness !== undefined) updateData.years_in_business = body.yearsInBusiness ? parseInt(body.yearsInBusiness) : null;
    if (body.numberOfEmployees !== undefined) updateData.number_of_employees = body.numberOfEmployees ? parseInt(body.numberOfEmployees) : null;
    if (body.numberOfBranches !== undefined) updateData.number_of_branches = body.numberOfBranches ? parseInt(body.numberOfBranches) : null;
    if (body.currentClientsPerMonth !== undefined) updateData.current_clients_per_month = body.currentClientsPerMonth ? parseInt(body.currentClientsPerMonth) : null;
    if (body.averageTicket !== undefined) updateData.average_ticket = body.averageTicket ? parseInt(body.averageTicket) : null;
    if (body.facebookFollowers !== undefined) updateData.facebook_followers = body.facebookFollowers ? parseInt(body.facebookFollowers) : null;

    // Other
    if (body.knownCompetition !== undefined) updateData.known_competition = body.knownCompetition;
    if (body.highSeason !== undefined) updateData.high_season = body.highSeason;
    if (body.criticalDates !== undefined) updateData.critical_dates = body.criticalDates;
    if (body.birthday !== undefined) updateData.birthday = body.birthday || null;
    if (body.anniversaryDate !== undefined) updateData.anniversary_date = body.anniversaryDate || null;
    if (body.otherAchievements !== undefined) updateData.other_achievements = body.otherAchievements;
    if (body.specificRecognitions !== undefined) updateData.specific_recognitions = body.specificRecognitions;

    // Perform update
    const { data: updatedLead, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('entity_type', 'lead')
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error);
      return NextResponse.json({ error: "Failed to update lead: " + error.message }, { status: 500 });
    }

    // Ensure agent exists (for older leads or manual updates)
    try {
      const { agentService } = await import('@/lib/donna/services/AgentService');
      await agentService.ensureAgent(id);
    } catch (e) {
      console.error('⚠️ LeadUpdateAPI: Error ensuring agent:', e);
    }

    // Trigger immediate planning (Donna Micro)
    try {
      const { planningEngine } = await import('@/lib/donna/services/PlanningEngine');
      await planningEngine.generatePlanningForContact(id);
    } catch (e) {
      console.error('⚠️ LeadUpdateAPI: Error triggering planning:', e);
    }

    return NextResponse.json({ message: "Lead updated successfully", data: updatedLead }, { status: 200 });

  } catch (error) {
    console.error("Error in PATCH /api/leads/[id]:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

  // audit-log: Passive security check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(`⚠️ [SECURITY AUDIT] Unauthorized access attempt to DELETE /api/leads/${params.id}`);
  }

  const { id } = params;

  try {
    // Soft delete: Demote to prospect and mark as not interested
    // We add a note to track why it was dropped

    // First fetch current notes to append
    const { data: current } = await supabase.from('contacts').select('notes').eq('id', id).single();
    const newNote = `\n[${new Date().toLocaleDateString()}] Lead marcado como CAÍDO (No interesado).`;
    const finalNotes = (current?.notes || '') + newNote;

    const { error } = await supabase
      .from('contacts')
      .update({
        entity_type: 'prospect',
        outreach_status: 'not_interested',
        status: 'sin_contacto', // Reset lead status so it doesn't show in kanban if query is loose
        notes: finalNotes
      })
      .eq('id', id)
      .eq('entity_type', 'lead');

    if (error) {
      console.error("Error dropping lead:", error);
      return NextResponse.json({ error: "Failed to drop lead" }, { status: 500 });
    }

    return NextResponse.json({ message: "Lead dropped successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/leads/[id]:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// Keep PUT for backward compatibility if needed, aliasing PATCH logic or requiring full update
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return PATCH(request, { params });
}