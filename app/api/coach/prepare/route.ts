
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
   
2. **MANEJO DE NOMBRES ((NOMBRE)):**
   - **IMPORTANTE:** Cuando uses ((NOMBRE)), identifica el **PRIMER NOMBRE** y el **PRIMER APELLIDO** del contacto. 
   - EVITA usar solo el apellido (ej: No digas "Hola Gonzales", di "Hola Vanessa Gonzales"). 
   - Si solo hay nombres en mayúsculas, conviértelos a formato de Nombre Propio (ej: "VANESSA" -> "Vanessa").

3. **MISIÓN:** Generar los guiones exactos para:
   - **DUEÑO:** Técnica de Igualación de estatus, dolor del 20-30% de comisión.
   - **RECEPCIÓN:** Enfoque amable, "no es una venta", pedir apoyo para reenviar video.
   - **OCUPADO:** Máxima brevedad, directo al grano, envío de video.
   - **ENOJADO:** Empatía táctica, validación de su tiempo, curiosidad sobre por qué el enojo ("otros hoteles me han dicho lo mismo...").

4. **DESARROLLO EXTENSO Y PERSUASIVO (PROHIBIDO PARÉNTESIS):**
   - **CRÍTICO:** Debes desarrollar el guion COMPLETO y con **sustancia**. 
   - No te quedes en la superficie. Si hablas del dolor de las comisiones, profundiza en que ese dinero es el margen de ganancia real que el hotel está regalando.
   - **NUNCA** utilices marcadores de posición entre paréntesis como "(Seguir estructura...)". 
   - Escribe exactamente lo que César debe decir, asegurándote de que el pitch tenga un cuerpo persuasivo antes del cierre.

---

## ESTRUCTURAS DE REFERENCIA (DESARRÓLLALAS CON CREATIVIDAD Y PODER)

### PITCH A – DUEÑO / ADMINISTRADOR
"Buenas tardes, ¿hablo con ((NOMBRE))?
Un gusto, ((NOMBRE)).
Le saluda César Reyes.
Le llamo porque trabajamos solo con hoteles en Ecuador,
ayudándolos a reducir dependencia de Booking y captar más reservas directas.
¿Me regala un minuto y si no le aporta, cortamos sin problema?

[Aquí desarrolla con PODER: Habla de que el 30% que se lleva Booking es el presupuesto que ellos podrían usar para mejorar el hotel o aumentar su utilidad neta. Menciona que Google hoy permite que el hotel aparezca por encima de Booking si se hace bien, captando al cliente que ya los está buscando pero termina reservando en la OTA por comodidad. Explica que nosotros les damos esa 'comodidad' en su propio sitio]"

### PITCH B – RECEPCIÓN
"Buenas tardes 😊
¿Me regala su nombre, por favor?
Mucho gusto, ((NOMBRE)).
Mi nombre es César Reyes.
Le llamo muy breve, no es una venta para usted, por si acaso.
Le explico: ayudamos al hotel a captar reservas directas para que no dependan tanto de las plataformas que cobran mucho. 
¿Me podría apoyar enviándole un video de 2 minutos a la persona encargada para que lo vea con calma? 
Es algo que beneficia directamente la rentabilidad del hotel donde usted trabaja."

### PITCH C – DUEÑO OCUPADO ("DÍGAME RÁPIDO")
"Perfecto, ((NOMBRE)), voy directo al grano para no quitarle tiempo.
Ayudamos a hoteles como ((HOTEL))
a posicionarse en Google para captar reservas directas,
logrando que ese 20% de comisión se quede en el hotel y no en Holanda.
Le envío un video corto de 2 minutos al WhatsApp que explica la estrategia exacta, ¿le parece que lo revise hoy mismo?"

### PITCH D – DUEÑO ENOJADO / CONTENCIÓN
"Entiendo perfectamente, ((NOMBRE)), y le agradezco la frontalidad. 
Sé que recibe mil llamadas de gente queriendo venderle cosas que no funcionan.
Mi llamada es distinta porque solo trabajamos con hoteles y solo nos enfocamos en una cosa: que el hotel deje de ser 'esclavo' de las comisiones de Booking.
¿Me permite 30 segundos para decirle cómo logramos que otros hoteles en Ecuador bajen su dependencia y usted decide si me cuelga o no?"

---

## FORMATO DE SALIDA (JSON)
Debes devolver un JSON con esta estructura exacta:
{
  "pitches": {
    "asesor": "Guion desarrollado, PERSUASIVO y COMPLETO para DUEÑO...",
    "consultor": "Guion desarrollado, AMABLE y COMPLETO para RECEPCIÓN...",
    "vendedor": "Guion desarrollado, DIRECTO y COMPLETO para OCUPADO...",
    "contencion": "Guion desarrollado, EMPÁTICO y COMPLETO para ENOJADO..."
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
