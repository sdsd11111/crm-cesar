
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
Tu misión es generar un **PITCH ESTRATÉGICO PERSONALIZADO**.

**REGLAS DE ORO:**
1. **Detección de Interlocutor:**
   - Si el modo es **ASESOR**, usa el **PITCH A (Dueño/Admin)**.
   - Si el modo es **CONSULTOR**, usa el **PITCH B (Recepción)**.
   - Si el modo es **VENDEDOR**, usa el **PITCH C (Dueño Ocupado)**.
   - Si el modo es **CONTENCIÓN**, adapta el Pitch A con un tono más empático y pausado.

2. **FORMATO CRÍTICO (LEGIBILIDAD):** 
   - El pitch DEBE tener **saltos de línea frecuentes** (frases cortas). 
   - NO envíes un bloque de texto denso. César debe poder leer línea por línea mientras habla.
   - Usa ((NOMBRE)) para el nombre del contacto y ((HOTEL)) para el nombre comercial.

3. **Técnica de Igualación:**
   - Para dueños: Inicia formal con nombre completo, luego pasa a primer nombre para igualar estatus.

---

## ESCENARIOS TÁCTICOS

### PITCH A – DUEÑO / ADMINISTRADOR
"Buenas tardes, ¿hablo con ((NOMBRE))?
Un gusto, ((NOMBRE)).
Le saluda César Reyes.
Le llamo porque trabajamos solo con hoteles en Ecuador,
ayudándolos a reducir dependencia de Booking y captar más reservas directas.
¿Me regala un minuto y si no le aporta, cortamos sin problema?

Vi que ustedes trabajan con Booking,
y es una buena decisión,
porque hay viajeros a los que es difícil llegar por cuenta propia.

(Pausa breve)
Lo que escucho muy seguido en el sector es que,
entre comisión, IVA y costos de tarjeta,
una reserva puede terminar costando entre 20 y 30%.
(Pausa)
¿Más o menos están por ahí?

El problema no es Booking en sí.
El problema es que cuando el crecimiento depende solo de plataformas externas,
se vuelve muy difícil competir,
sobre todo hoy con Airbnb y guerra de precios.

(Silencio corto)
En Objetivo, lo que hacemos es ayudar a hoteles
a depender menos de estas plataformas
y a capturar reservas directas de personas que ya están buscando hospedaje en Google.

Por eso quería preguntarle algo muy puntual:
¿Le gustaría ver cómo lo están haciendo otros hoteles similares al suyo?

Perfecto, entonces ((NOMBRE)),
le voy a enviar por WhatsApp una página con un video corto.
Revíselo con calma,
porque nos contrate o no,
lo que mostramos ahí es totalmente aplicable a su hotel.

Y solo para que lo tenga claro:
no es manejo de redes ni publicaciones.
Es un sistema enfocado exclusivamente en capturar reservas directas desde Google,
y es a lo único que nos dedicamos desde 2020.

((NOMBRE)), ha sido muy amable.
¿Tiene alguna pregunta rápida antes de cortar?"

### PITCH B – RECEPCIÓN
"Buenas tardes 😊
¿Me regala su nombre, por favor?
Mucho gusto, ((NOMBRE)).
Mi nombre es César Reyes.
Le llamo muy breve, no es una venta para usted, por si acaso.
Trabajo únicamente con hoteles aquí en Ecuador,
ayudándolos a captar reservas directas desde Google,
para depender menos de plataformas como Booking.

Quisiera enviarle un video muy corto (2 minutos)
para que, si usted lo considera oportuno,
se lo pueda compartir al propietario
o a la persona encargada del hotel.

(esperar respuesta)

Perfecto, muchas gracias 🙏
En el mensaje voy a poner una frase
para que usted solo lo reenvíe,
así no le quito más tiempo."

### PITCH C – DUEÑO OCUPADO
"Perfecto, ((NOMBRE)), voy directo.
Ayudamos a hoteles como ((HOTEL))
a captar más reservas directas desde Google,
para depender menos de Booking
y reducir comisiones.

Le voy a enviar ahora mismo un video de 2 minutos
donde lo explico de forma clara.
Si le hace sentido, lo vemos aplicado a su hotel;
y si no, no le quito más tiempo.
¿Le parece bien?"

---

## FORMATO DE SALIDA (JSON)
{
  "pitch": "El pitch elegido y formateado con saltos de línea y variables rellenas",
  "disparadores": [
    { "titulo": "DISPARADOR 1", "keywords": ["..."] },
    ...
  ]
}
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { entityId, entityType, role } = body;

        if (!entityId || !entityType || !role) {
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

            DATOS DE ENTRADA:
            MODO SOLICITADO: ${role.toUpperCase()}
            
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
