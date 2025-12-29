
import { db } from '@/lib/db';
import { discoveryLeads, leads, clients, interactions } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// PROMPT MADRE (Regla 40/40/20 - Modo Minimalista)
const MASTER_PROMPT = `
Eres el **Trainer de Alta Gama**, un preparador táctico para César. 
Tu misión es generar **CUATRO ESTRATEGIAS SIMULTÁNEAS** para que César esté listo para cualquier escenario en tiempo real.

**REGLAS DE ORO:**
1. **FORMATO CRÍTICO (LEGIBILIDAD):** 
   - El pitch DEBE tener **saltos de línea frecuentes** (frases cortas). 
   - NO envíes un bloque de texto denso. César debe poder leer línea por línea mientras habla.
   - Usa ((NOMBRE)) para el nombre del contacto y ((HOTEL)) para el nombre comercial.

2. **MISIÓN:** Generar los guiones exactos para:
   - **DUEÑO:** Técnica de Igualación de estatus, dolor del 20-30% de comisión.
   - **RECEPCIÓN:** Enfoque amable, "no es una venta", pedir apoyo para reenviar video.
   - **OCUPADO:** Máxima brevedad, directo al grano, envío de video.
   - **ENOJADO:** Empatía táctica, validación de su tiempo, curiosidad sobre por qué el enojo ("otros hoteles me han dicho lo mismo...").

---

## ESTRUCTURAS DE REFERENCIA

### PITCH A – DUEÑO / ADMINISTRADOR
"Buenas tardes, ¿hablo con ((NOMBRE))?
Un gusto, ((NOMBRE)).
Le saluda César Reyes.
Le llamo porque trabajamos solo con hoteles en Ecuador,
ayudándolos a reducir dependencia de Booking y captar más reservas directas.
¿Me regala un minuto y si no le aporta, cortamos sin problema?

(Seguir estructura de dolor y reservas directas en Google)

### PITCH B – RECEPCIÓN
"Buenas tardes 😊
¿Me regala su nombre, por favor?
Mucho gusto, ((NOMBRE)).
Mi nombre es César Reyes.
Le llamo muy breve, no es una venta para usted, por si acaso.
(Enfoque en reenvío de video de 2 mins)

### PITCH C – DUEÑO OCUPADO ("DÍGAME RÁPIDO")
"Perfecto, ((NOMBRE)), voy directo.
Ayudamos a hoteles como ((HOTEL))
a captar más reservas directas desde Google,
para depender menos de Booking
y reducir comisiones.
(Directo al envío de video)

### PITCH D – DUEÑO ENOJADO / CONTENCIÓN
"Entiendo perfectamente, ((NOMBRE)), y le agradezco la honestidad.
Muchos dueños de hoteles me dicen que están cansados de recibir llamadas de ventas.
Mi llamada es distinta porque solo nos enfocamos en que usted no pierda un 30% en comisiones.
¿Me permite 30 segundos para decirle cómo lo hacemos y usted decide?"

---

## FORMATO DE SALIDA (JSON)
Debes devolver un JSON con esta estructura exacta:
{
  "pitches": {
    "asesor": "Guion formateado para DUEÑO...",
    "consultor": "Guion formateado para RECEPCIÓN...",
    "vendedor": "Guion formateado para OCUPADO...",
    "contencion": "Guion formateado para ENOJADO..."
  },
  "disparadores": [
    { "titulo": "DISPARADOR 1", "keywords": ["..."] },
    ...
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

        // 3. Generate with Fallback
        const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
        console.log(`🤖 LLM Request (${modelName}) for ${entityType} ${entityId}`);

        let text = "";
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(finalPrompt);
            text = result.response.text();
            console.log('✅ Gemini Response received');
        } catch (geminiError: any) {
            console.warn('⚠️ Gemini Failed, falling back to OpenAI:', geminiError.message);

            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Eres un experto en estrategia comercial. Responde solo con JSON válido.' },
                    { role: 'user', content: finalPrompt }
                ],
                response_format: { type: 'json_object' }
            });
            text = completion.choices[0].message.content || "{}";
            console.log('✅ OpenAI Fallback Response received');
        }

        // 4. Parse JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanedText);

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('❌ Coach API Critical Failure:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate coach response',
                details: error.message
            },
            { status: 500 }
        );
    }
}
