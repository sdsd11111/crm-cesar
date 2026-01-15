
import { db } from '@/lib/db';
import { discoveryLeads, leads, interactions } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getAIClient, getModelId } from '@/lib/ai/client';

const MASTER_PROMPT = `
Eres el **Trainer de Alta Gama**, un preparador táctico para César. 
Tu misión es generar **CINCO ESTRATEGIAS SIMULTÁNEAS** para que César esté listo para cualquier escenario en tiempo real.

**REGLAS DE ORO:**
1. **FORMATO CRÍTICO (LEGIBILIDAD):** 
   - El pitch DEBE tener **saltos de línea explícitos** (\n) después de cada frase corta. 
   - NO envíes un bloque de texto denso. Genera una línea por cada idea visualmente separada.
   
2. **MANEJO DE VARIABLES DINÁMICAS (REEMPLAZO OBLIGATORIO):**
   - **[NOMBRE]:** Reemplazar con el **PRIMER NOMBRE** y **PRIMER APELLIDO** del contacto. Si no se tiene, usa "estimado" o similar de forma natural.
   - **[CIUDAD]:** Reemplazar con la ciudad del prospecto (ej: "Cuenca", "Manta").
   - **[X] y [Y]:** Reemplazar con números de búsquedas realistas basados en la ciudad (ej: 150 y 200).
   - **IMPORTANTE:** No dejes corchetes [ ] en el resultado final. Convierte todo a formato de Nombre Propio.

3. **MISIÓN:** Generar los guiones exactos para:
   - **SIN BOOKING (NUEVO Escenario):** Para prospectos donde el análisis de Google es la clave.
   - **DUEÑO (RECOMENDADO):** Pitch principal actualizado enfocado en ahorro de comisiones y ciudad.
   - **ENOJADO/OCUPADO:** Máxima brevedad, directo al grano.
   - **RECEPCIÓN:** Enfoque en compartir página web y video al propietario.
   - **WHATSAPP:** Resumen táctico persuasivo.

---

## PLANTILLAS EXACTAS (REEMPLAZA VARIABLES)

### PITCH 1: SIN BOOKING (ANÁLISIS GOOGLE)
Buenas, ¿hablo con [NOMBRE]?
[NOMBRE], un gusto, le saluda César Reyes de la empresa Objetivo.
Somos consultores para el sector turístico.
¿Le puedo tomar 30 segundos… y si no le aporta, cortamos sin problema?
(pausa)
Gracias.
Mire, hoy en la mañana hice un análisis de búsquedas en Google
específicamente para [CIUDAD].
¿Sabe cuántas veces al día la gente busca "hotel en [CIUDAD]"
o "dónde hospedarse en [CIUDAD]"?
(pausa medio segundo - NO dejes que responda)
Entre [X] y [Y] veces diarias.
Solo en Google.
Ahora, la pregunta que le quiero hacer es esta:
De esas [X] búsquedas diarias,
¿cuántas cree que terminan viendo SU hotel?
(silencio - CLAVE, déjalo procesar)
Exacto.
Por eso mi llamada es muy concreta:
¿Le interesa que cuando alguien busque hospedaje en [CIUDAD],
usted aparezca en los primeros resultados
sin depender de Booking ni pagar comisiones?
(si dice "sí" o "depende" o cualquier cosa que no sea NO rotundo)
Perfecto. Esto es imposible explicarlo bien por teléfono.
Le propongo algo: una videollamada de 15 minutos.
Yo le muestro exactamente cómo funciona,
usted ve si le hace sentido para su hotel, y si no le cierra, no pasa nada.
¿Le viene mejor hoy en la tarde o mañana en la mañana?
(cuando agende)
[NOMBRE], perfecto. Le envío el link por WhatsApp.
¿Tiene alguna pregunta rápida antes de cortar?

### PITCH 2: DUEÑO V3 (EMPATÍA + CONTROL DEL CLIENTE)
Buenas, ¿hablo con [NOMBRE]?
[NOMBRE], un gusto, le saluda César Reyes estuve revisando su hotel y me llamó mucho la atención [UN DETALLE POSITIVO REAL].
(AI: Aquí debes generar un breve PARAFRASEO de 1 o 2 líneas sobre su propuesta de valor basado en la investigación).
Con algo así, me imagino que conseguir turistas debe ser bastante fácil, la mayoría debe llegar directo, ¿no?
(pausa - déjalo responder)
•	¿Y la mayoría le reserva por dónde?
•	¿Y qué porcentaje se le va en comisión más o menos?
•	¿Y eso lo pueden controlar ustedes o depende de la plataforma?
(escucha activa)
Mire qué curioso… tiene un lugar que encanta a la gente,
pero al mismo tiempo el control del cliente no lo tiene usted.
Mi recomendación es esta: trabaje con Booking, porque ellos tienen un público difícil de alcanzar,
pero haga que el turista que ya lo conoce le reserve a usted de forma directa.
¿Le interesa que le muestre cómo recuperar el control de su cliente en una videollamada de 15 minutos?
¿Le viene mejor hoy en la tarde o mañana en la mañana?

### PITCH 3: DUEÑO ENOJADO / MUY OCUPADO
[NOMBRE], entiendo que esté ocupado, no le quito más de 20 segundos.
Trabajo con hoteles en [CIUDAD] ayudándolos a reducir las comisiones que pagan a Booking, sin dejar la plataforma.
Si le interesa ahorrar entre un 15% y un 18% por reserva, lo vemos en una videollamada de 15 minutos y usted decide.
¿Le viene mejor hoy o mañana?

### PITCH 4: RECEPCIONISTA (FILTRO)
Buenas tardes 😊
¿Me regala su nombre, por favor?
Mucho gusto. Mi nombre es César Reyes.
Somos consultores turísticos y ayudamos a hoteles en [CIUDAD] a captar reservas directas desde Google para depender menos de Booking.
Quisiera enviarle una información clave al propietario para que ahorre en comisiones. ¿Me ayuda compartiéndole este video por WhatsApp?
Perfecto, se lo envío ahora mismo. Si luego podemos agendar 15 min con él, sería ideal.

---

## FORMATO DE SALIDA (JSON)
Devuelve un JSON con esta estructura exacta:
{
  "pitches": {
    "sin_booking": "Pitch Sin Booking...",
    "asesor": "Pitch Dueño V2...",
    "contencion": "Pitch Dueño Enojado...",
    "consultor": "Pitch Recepcionista...",
    "whatsapp_dueño": "Hola [NOMBRE]... como conversamos para su hotel en [CIUDAD]..."
  },
  "disparadores": [
    { "titulo": "VALOR DIFERENCIAL", "keywords": ["ahorro", "google", "directo"] }
  ]
}
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { entityId, entityType } = body;

        if (!entityId || !entityType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let contextData = "";

        // 1. Fetch Data
        if (entityType === 'discovery') {
            const lead = await db.query.discoveryLeads.findFirst({
                where: eq(discoveryLeads.id, entityId),
            });
            if (!lead) return NextResponse.json({ error: 'Discovery Lead not found' }, { status: 404 });

            // Pass raw name to LLM for better parsing
            const rawName = lead.razonSocialPropietario || lead.nombreComercial;

            contextData = `
                PERFIL DISCOVERY:
                Nombre Comercial: ${lead.nombreComercial}
                Dueño (Nombre Crudo): ${rawName}
                Tipo: ${lead.actividadModalidad || lead.tipoEstablecimiento}
                Ubicación: ${lead.provincia}, ${lead.canton}
                
                DATOS ESPECÍFICOS DE INVESTIGACIÓN:
                - Booking/OTAs: ${lead.bookingInfo || "No detectado"}
                - Google/GMB: ${lead.googleInfo || "No detectado"}
                
                REPORTE COMPLETO: ${lead.researchData || "Sin datos de investigación."}
            `;

        } else if (entityType === 'lead') {
            const lead = await db.query.leads.findFirst({
                where: eq(leads.id, entityId),
            });
            if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

            // Get last few interactions
            const history = await db.query.interactions.findMany({
                where: eq(interactions.contactId, entityId),
                orderBy: [desc(interactions.performedAt)],
                limit: 5
            });

            contextData = `
                PERFIL LEAD:
                Nombre: ${lead.businessName}
                Tipo: ${lead.businessType}
                Dolor Cuantificado: ${lead.quantifiedProblem || 'No especificado'}
                Objetivo: ${lead.conservativeGoal || 'No especificado'}
                
                HISTORIAL RECIENTE:
                ${history.map(h => `- ${h.type} (${h.outcome}): ${h.content}`).join('\n')}
            `;
        }

        // 2. Build Prompt
        const finalPrompt = `
            ${MASTER_PROMPT}

            CONTEXTO DEL INTERLOCUTOR:
            ${contextData}
        `;

        // 3. Generate using Standard Model (Faster for templates)
        console.log(`🤖 Strategy Coach Request (Fast/Standard) for ${entityType} ${entityId}`);

        const client = getAIClient('STANDARD');
        const model = getModelId('STANDARD');

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: 'user', content: finalPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content || "{}";
        console.log('✅ AI Response received');

        // 4. Parse JSON
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            console.warn('⚠️ JSON direct parse failed, trying extraction');
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                jsonResponse = JSON.parse(match[0]);
            } else {
                throw new Error('Could not parse AI response as JSON');
            }
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('❌ Coach API Critical Failure:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate coach response',
                details: error.message,
                pitches: {
                    asesor: "Error: No se pudo generar el pitch.",
                    contencion: "Error: No se pudo generar el pitch.",
                    consultor: "Error: No se pudo generar el pitch.",
                    workshop: "Error: No se pudo generar el pitch."
                }
            },
            { status: 500 }
        );
    }
}
