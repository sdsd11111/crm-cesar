import { NextResponse } from 'next/server';

/**
 * Verifica que la petición entrante provenga del bot Donna autorizado.
 * Compara el encabezado 'Authorization: Bearer <token>' contra la
 * variable de entorno DONNA_API_SECRET.
 *
 * @returns `null` si la autenticación es válida (continúa el flujo)
 * @returns `NextResponse` con error 401 o 500 si falla
 */
export function verifyBotAuth(request: Request): NextResponse | null {
    const secret = process.env.DONNA_API_SECRET;

    if (!secret) {
        console.error('[BotAuth] DONNA_API_SECRET is not configured in environment variables.');
        return NextResponse.json(
            { error: 'Server misconfiguration: bot secret not set.' },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || token !== secret) {
        console.warn('[BotAuth] Unauthorized bot request. Invalid or missing token.');
        return NextResponse.json(
            { error: 'Unauthorized. Provide a valid Authorization: Bearer <DONNA_API_SECRET> header.' },
            { status: 401 }
        );
    }

    return null; // Auth OK
}
