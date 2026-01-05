
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
   
2. **MANEJO DE NOMBRES (REEMPLAZO OBLIGATORIO):**
   - **CRÍTICO:** Debes REEMPLAZAR el texto ((NOMBRE)) de la plantilla con el **PRIMER NOMBRE** y **PRIMER APELLIDO** real del contacto.
   - **NO** dejes ((NOMBRE)) escrito en el texto final.
   - Si solo hay nombres en mayúsculas, conviértelos a formato de Nombre Propio.

3. **MISIÓN:** Generar los guiones exactos para:
   - **DUEÑO (RECOMENDADO):** Pitch principal de ahorro de comisiones (10-20%) y captura de reservas directas.
   - **ENOJADO/OCUPADO:** Máxima brevedad, directo al ahorro de comisiones sin dejar Booking.
   - **RECEPCIÓN:** Enfoque en compartir página web y video al propietario.
   - **WORKSHOP:** "Última bala" para no interesados. Venta de taller de $60 para web propia en 2 horas.
   - **WHATSAPP:** Resumen táctico según sea dueño o recepción.

4. **USA LAS PLANTILLAS EXACTAS Y REEMPLAZA VARIABLES:**
   - ((NOMBRE)): Nombre + Apellido del contacto.
   - ((HOTEL)): Nombre del hotel/negocio.

---

## PLANTILLAS EXACTAS (ÚSALAS TAL CUAL)

### PITCH 1: PRINCIPAL (RECOMENDADO)
Buenas, ¿hablo con ((NOMBRE))?
((NOMBRE)), un gusto, le saluda César Reyes de la empresa Objetivo.
Somos consultores para el sector turístico.
¿Le puedo tomar 30 segundos… y si no le aporta, cortamos sin problema?
(pausa)
Gracias.
Vi que ustedes trabajan con Booking
y le voy a hacer una pregunta muy directa:
¿Le parece interesante ahorrar entre un 10% y un 20% anual
en las comisiones que hoy le paga a Booking?
(silencio)
No le estoy hablando de dejar Booking,
ni de redes sociales ni de publicaciones.
Lo único que hacemos es brindar una herramienta
que ayuda a captar más reservas directas desde Google
de personas que ya están buscando hospedaje.
Por eso mi llamada es solo para esto:
¿Quiere conocer cómo ahorrar esa comisión
y captar ese tipo de clientes de forma directa?
Perfecto.
Por teléfono es largo de explicar y prefiero no quitarle tiempo.
¿Qué le parece si lo vemos en una videollamada corta
y usted decide si le hace sentido o no?
¿Le viene mejor hoy o mañana, según su agenda?
((NOMBRE)), ha sido muy amable.
¿Tiene alguna pregunta rápida antes de cortar?

### PITCH 2: DUEÑO ENOJADO / MUY OCUPADO
((NOMBRE)), entiendo que esté ocupado, no le quito más de 20 segundos.
Trabajo con hoteles y hostales ayudándolos a reducir las comisiones que pagan a Booking,
sin dejar la plataforma.
Si le parece interesante ahorrar entre un 10% y un 20% anual,
lo vemos en una videollamada corta
y usted decide si tiene sentido para su negocio.
¿Le viene mejor hoy o mañana?

### PITCH 3: RECEPCIONISTA
Buenas tardes 😊
¿Me regala su nombre, por favor?
Mucho gusto ((NOMBRE DE RECEPCIONISTA)).
Mi nombre es César Reyes.
Somos consultores para el sector turístico en Ecuador
y ayudamos a hoteles y hostales a captar reservas directas desde Google,
para depender menos de plataformas como Booking.
Quisiera enviarles nuestra página web para que,
si usted lo considera oportuno,
se la pueda compartir al propietario o a la persona encargada.
(pausa)
Perfecto, gracias 🙏
En el mensaje voy a dejar una frase
para que usted solo la reenvíe, así no le quito más tiempo.
Y si luego podemos agendar una videollamada corta
con la persona encargada, sería ideal.

### PITCH 4: WORKSHOP (ÚLTIMA BALA)
Entiendo perfectamente.
Muchos hoteles no están en el momento de hacer cambios grandes,
y eso está bien.
Justamente por eso estamos probando algo diferente, con un grupo reducido:
👉 Si hoy no tiene página web propia,
¿invertiría $60 para salir con una en solo 2 horas?
La dinámica es muy simple:
usted solo sigue lo que voy haciendo en pantalla y completa información básica
(fotos, contactos, habitaciones, colores).
No es nada técnico.
Trabajamos con un grupo limitado de 15 hoteles.
Al finalizar, su sitio queda listo y nosotros lo ponemos online.
Si le parece, le envío la información por WhatsApp
y usted decide con calma si forma parte del grupo o lo deja pasar.

---

## FORMATO DE SALIDA (JSON)
Devuelve un JSON con esta estructura exacta:
{
  "pitches": {
    "asesor": "Pitch Principal...",
    "contencion": "Pitch Dueño Enojado...",
    "consultor": "Pitch Recepcionista...",
    "workshop": "Pitch Workshop...",
    "whatsapp_dueño": "Hola ((NOMBRE))... como conversamos, ahorro 10-20%...",
    "whatsapp_recep": "Hola... como conversamos por tel, ayudamos a ((HOTEL))..."
  },
  "disparadores": [
    { "titulo": "TÍTULO CORTO", "keywords": ["palabra1", "palabra2"] }
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
