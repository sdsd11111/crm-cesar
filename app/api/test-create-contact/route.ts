import { NextRequest, NextResponse } from 'next/server';
import { cortexRouter } from '@/lib/donna/services/CortexRouterService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint de prueba para crear contactos vía Donna
 * Simula el flujo completo de Telegram
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Missing text parameter' },
                { status: 400 }
            );
        }

        console.log(`🧪 Testing CREATE_CONTACT with: ${text}`);

        const result = await cortexRouter.processInput({
            text,
            source: 'cesar',
        });

        return NextResponse.json({
            success: true,
            input: text,
            result
        });
    } catch (error: any) {
        console.error('❌ Test error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
