import { NextRequest, NextResponse } from 'next/server';
import { cortexRouter } from '@/lib/donna/services/CortexRouterService';
import { GoogleCalendarService } from '@/lib/google/CalendarService';
import fs from 'fs';
import path from 'path';

interface TestLog {
    timestamp: string;
    step: string;
    data: any;
    type: 'info' | 'success' | 'error' | 'warning';
}

/**
 * API de Testing para Telegram - Versión Unificada (Cortex Router)
 * Simula el flujo usando el Mismo Cerebro que Producción.
 */
export async function POST(req: NextRequest) {
    const logs: TestLog[] = [];
    const startTime = Date.now();

    function addLog(step: string, data: any, type: TestLog['type'] = 'info') {
        logs.push({
            timestamp: new Date().toISOString(),
            step,
            data,
            type
        });
    }

    try {
        const { text, customPrompts } = await req.json();

        addLog('Inicio', { text, hasCustomPrompts: !!customPrompts }, 'info');

        if (!text) {
            return NextResponse.json({
                success: false,
                error: 'No text provided',
                logs
            });
        }

        // 1. Cargar prompts para RETORNARLOS al UI (Solo lectura visual)
        // El verdadero prompt usado será enviado a Cortex como override si existe
        const promptsDir = path.join(process.cwd(), 'lib', 'donna', 'prompts');
        // Nota: Agrupamos prompts. El router está en raiz de prompts.

        const routerPrompt = customPrompts?.router ||
            fs.readFileSync(path.join(promptsDir, 'cortex_router.md'), 'utf-8');

        // Los otros prompts son menos relevantes en modo unificado, pero los mantenemos para no romper UI
        const createPrompt = "N/A (Logic integrated in Cortex)";
        const queryPrompt = "N/A (Logic integrated in Cortex)";

        addLog('Configuración', {
            usingCustomPrompt: !!customPrompts?.router
        }, 'info');

        // 2. Procesar con Cortex Router (Unified Brain)
        addLog('Procesando con Cortex Router', { text }, 'info');

        const replies: string[] = [];

        // Usamos un ChatID fijo para el entorno de pruebas, así mantiene "memoria de laboratorio"
        // Diferente al chatId real de Telegram para no mezclar.
        const TEST_CHAT_ID = 'TEST_LAB_CESAR_V2';

        const result = await cortexRouter.processInput({
            text: text,
            source: 'cesar', // Tratamos como input directo del dueño
            chatId: TEST_CHAT_ID,
            promptOverride: customPrompts?.router, // Inyectamos prompt del editor
            onReply: (msg) => {
                replies.push(msg);
                addLog('Donna Reply', msg, 'success');
            }
        });

        addLog('Resultado de Cortex', result, 'success');

        // 3. Obtener eventos de calendario para comparación visual (si es relevante)
        const calendar = new GoogleCalendarService('objetivo.cesar@gmail.com');
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

        let calendarEvents: any[] = [];
        try {
            calendarEvents = await calendar.listEvents(
                now.toISOString(),
                weekLater.toISOString(),
                20
            );
        } catch (error: any) {
            addLog('Nota', { msg: 'No se pudo listar calendario (warning menor)', error: error.message }, 'warning');
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            duration: `${duration}ms`,
            reply: replies.join('\n\n'), // Unimos respuestas múltiples
            actionTaken: result.intent, // Mostramos la intención detectada
            logs,
            calendarEvents,
            prompts: {
                router: routerPrompt,
                create: createPrompt,
                query: queryPrompt
            }
        });

    } catch (error: any) {
        addLog('Error Fatal', {
            message: error.message,
            stack: error.stack
        }, 'error');

        return NextResponse.json({
            success: false,
            error: error.message,
            logs
        }, { status: 500 });
    }
}
