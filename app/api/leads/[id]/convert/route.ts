import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const leadId = params.id;
    const { contractValue, initialPayment, balanceDueDate } = await request.json();

    // 1. Update entity_type to 'client'
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({
        entity_type: 'client',
        converted_to_client_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('Error converting lead to client in contacts table:', updateError);
      return NextResponse.json({ error: 'Failed to convert lead: ' + updateError.message }, { status: 500 });
    }

    // 1.5. Mirror to legacy 'clients' table for backward compatibility and FK satisfaction
    const { error: clientInsertError } = await supabase
      .from('clients')
      .upsert({
        id: updatedContact.id,
        lead_id: leadId,
        business_name: updatedContact.business_name,
        contact_name: updatedContact.contact_name,
        phone: updatedContact.phone,
        email: updatedContact.email,
        city: updatedContact.city,
        address: updatedContact.address,
        updated_at: new Date().toISOString()
      });

    if (clientInsertError) {
      console.error('Error mirroring to legacy clients table:', clientInsertError);
      // We continue even if this fails, but it explains transaction failures if it does
    }

    // 2. Automated Financial Integration (Phase 1 of Mission Control)
    if (contractValue > 0) {
      const transactionsToInsert = [];

      // A. Initial Payment (Income Paid)
      if (initialPayment > 0) {
        transactionsToInsert.push({
          type: 'INCOME',
          category: 'Venta - Anticipo',
          description: `Anticipo de Contrato: ${updatedContact.business_name || updatedContact.contact_name}`,
          amount: initialPayment,
          date: new Date().toISOString(),
          status: 'PAID',
          sub_type: 'BUSINESS_VARIABLE',
          client_id: updatedContact.id
        });
      }

      // B. Remaining Balance (Income Pending)
      const balance = contractValue - initialPayment;
      if (balance > 0) {
        transactionsToInsert.push({
          type: 'INCOME',
          category: 'Venta - Saldo',
          description: `Saldo de Contrato: ${updatedContact.business_name || updatedContact.contact_name}`,
          amount: balance,
          date: new Date().toISOString(),
          due_date: balanceDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          sub_type: 'BUSINESS_VARIABLE',
          client_id: updatedContact.id
        });
      }

      if (transactionsToInsert.length > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .insert(transactionsToInsert);

        if (txError) console.error('Error creating linked transactions:', txError);
      }
    }

    // Initialize Agent (Ensures one exists for the new client)
    try {
      const { agentService } = await import('@/lib/donna/services/AgentService');
      await agentService.ensureAgent(updatedContact.id);
    } catch (e) {
      console.error('⚠️ ConvertAPI: Error initializing agent:', e);
    }

    // Trigger immediate planning (Donna Micro)
    try {
      const { planningEngine } = await import('@/lib/donna/services/PlanningEngine');
      await planningEngine.generatePlanningForContact(updatedContact.id);
    } catch (e) {
      console.error('⚠️ ConvertAPI: Error triggering planning:', e);
    }

    return NextResponse.json({ success: true, client: updatedContact });

  } catch (error) {
    console.error('Error converting lead:', error);
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 });
  }
}