
import { db } from '@/lib/db';
import { contacts, interactions } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getAIClient, getModelId } from '@/lib/ai/client';
import { getClientContext, formatContextForAI } from '@/lib/ai/context-fetcher';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MASTER_PROMPT = `
Eres el **Trainer de Alta Gama**, un preparador táctico para César. 
Tu misión es generar **CINCO ESTRATEGIAS SIMULTÁNEAS** para que César esté listo para cualquier escenario en tiempo real.

**REGLAS DE ORO:**
1. **FORMATO CRÍTICO (LEGIBILIDAD):** 
   - El pitch DEBE tener **saltos de línea explícitos** (\\n) después de cada frase corta. 
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
... (SAME AS BEFORE) ...
`;

export async function POST(req: Request) {
    // Initialize Supabase inside the handler to avoid build-time environment variable requirements
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const body = await req.json();
        const { entityId, compliment } = body;

        if (!entityId) {
            return NextResponse.json({ error: 'Missing contact ID' }, { status: 400 });
        }

        // 1. Fetch Unified Context
        const context = await getClientContext(supabase, entityId);
        if (!context.profile.id) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const formattedContext = formatContextForAI(context);

        const finalPrompt = `
            ${MASTER_PROMPT}

            CONTEXTO DEL INTERLOCUTOR:
            ${formattedContext}

            HALAGO / DETALLE ESPECÍFICO PROPORCIONADO POR EL USUARIO:
            ${compliment || 'Ninguno (puedes generar uno basado en la investigación si lo consideras mejor)'}
            
            REGLA ADICIONAL: Si el usuario proporcionó un halago arriba, DEBES integrarlo en el [UN DETALLE POSITIVO REAL] del PITCH 2.
        `;

        // 3. Generate using Standard Model
        console.log(`🤖 Strategy Coach Request (Gemini/Standard) for contact ${entityId}`);

        const aiClient = getAIClient('STANDARD');
        const modelId = getModelId('STANDARD');

        const completion = await aiClient.chat.completions.create({
            model: modelId,
            messages: [{ role: 'user', content: finalPrompt }],
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content || "{}";

        // 4. Parse JSON
        let jsonResponse = JSON.parse(text);

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
                    whatsapp_dueño: "Error: No se pudo generar el mensaje."
                }
            },
            { status: 500 }
        );
    }
}
