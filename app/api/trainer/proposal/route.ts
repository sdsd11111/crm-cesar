import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PROPOSAL_SYSTEM_PROMPT } from '@/app/lib/templates/proposal_hotel';
import { createServerClient } from '@/lib/supabase/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { leadId, source } = await req.json();

        if (!leadId) {
            return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
        }

        // Initialize Supabase Client
        const supabase = createServerClient();

        // 1. Fetch Lead Data
        let leadData = null;
        let basicVariables: any = {};

        if (source === 'discovery') {
            const { data, error } = await supabase
                .from('discovery_leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (error) throw new Error("Error fetching discovery lead: " + error.message);
            leadData = data;
            basicVariables = {
                nombre_negocio: data.nombre_comercial || data.businessName || "Su Negocio",
                nombre_cliente: data.razonSocialPropietario || data.representative || "Estimado cliente",
                fecha_propuesta: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            };
        } else {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', leadId)
                .single();

            if (error) throw new Error("Error fetching lead: " + error.message);
            leadData = data;
            basicVariables = {
                business_name: data.business_name || "Su Negocio",
                nombre_negocio: data.business_name || "Su Negocio",
                nombre_cliente: data.contact_name || "Estimado cliente",
                fecha_propuesta: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            };
        }

        // 2. Prepare Context for AI
        // Construct a rich context string from available data
        const researchContext = `
        INFORMACIÓN DEL NEGOCIO:
        - Nombre: ${basicVariables.nombre_negocio}
        - Cliente: ${basicVariables.nombre_cliente}
        - Ubicación: ${leadData.city || leadData.canton || "Ecuador"}
        - Tipo: ${leadData.businessType || leadData.actividadModalidad || "Hotel"}
        
        INVESTIGACIÓN PREVIA:
        ${leadData.investigacion || leadData.researchData || "No hay investigación detallada disponible, asume datos generales de un hotel local."}

        DATOS DIGITALES (Si disponibles):
        - Google Info: ${leadData.googleInfo || "N/A"}
        - Booking Info: ${leadData.bookingInfo || "N/A"}
        - Website: ${leadData.website || leadData.direccionWeb || "N/A"}
        `;

        console.log("Generating proposal for:", basicVariables.nombre_negocio);

        // 3. Call AI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: PROPOSAL_SYSTEM_PROMPT },
                { role: "user", content: researchContext }
            ],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const rawContent = completion.choices[0].message.content;

        if (!rawContent) {
            throw new Error("AI returned empty response");
        }

        const aiVariables = JSON.parse(rawContent);

        // 4. Merge Variables
        const finalVariables = {
            ...basicVariables,
            ...aiVariables
        };

        return NextResponse.json({ success: true, variables: finalVariables });

    } catch (error: any) {
        console.error("Proposal Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
