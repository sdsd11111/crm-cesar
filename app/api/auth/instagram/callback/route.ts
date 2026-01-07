import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        console.error('❌ Instagram Auth Error:', error);
        return NextResponse.json({ error: 'Auth failed', details: error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Attempt to read from DB first (Professional Onboarding)
    const [dbConfig] = await db.select().from(systemSettings).where(eq(systemSettings.key, 'instagram_config')).limit(1);
    const config = (dbConfig?.value as any) || {};

    const appId = config.appId || process.env.INSTAGRAM_APP_ID;
    const appSecret = config.appSecret || process.env.INSTAGRAM_APP_SECRET;

    // Auto-detect the origin to keep it flexible
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/instagram/callback`;

    console.log('🔄 Exchanging Instagram code for token...', { appId, redirectUri });

    try {
        // 1. Exchange short-lived code for Short-Lived Token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${redirectUri}&code=${code}`);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error('❌ Token exchange failed:', tokenData.error);
            return NextResponse.json({ error: 'Token exchange failed', details: tokenData.error }, { status: 400 });
        }

        const shortLivedToken = tokenData.access_token;

        // 2. (Optional but Recommended) Exchange for Long-Lived Token (60 days)
        const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
        const longLivedData = await longLivedRes.json();

        const finalToken = longLivedData.access_token || shortLivedToken;

        console.log('✅ Instagram Token Obtained Successfully');

        // 3. AUTO-SAVE to DB
        await db.insert(systemSettings)
            .values({
                key: 'instagram_config',
                value: { ...config, accessToken: finalToken },
                updatedAt: new Date()
            })
            .onConflictDoUpdate({
                target: systemSettings.key,
                set: {
                    value: { ...config, accessToken: finalToken },
                    updatedAt: new Date()
                }
            });

        console.log('💾 Token saved to database');

        // 4. Return a friendly UI with instructions
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0b0e11; color: #e9edef;">
                    <div style="background: #111b21; padding: 2.5rem; border-radius: 16px; border: 1px solid #202c33; text-align: center; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <div style="font-size: 50px; margin-bottom: 10px;">📸</div>
                        <h2 style="color: #00a884; margin-bottom: 10px;">¡Instagram Conectado!</h2>
                        <p style="color: #8696a0; font-size: 15px; line-height: 1.5;">
                            El token ha sido obtenido y <b>guardado automáticamente</b> en tu base de datos. 
                            Ya no es necesario configurar variables de entorno manualmente.
                        </p>
                        
                        <div style="margin: 25px 0; padding: 15px; background: #202c33; border-radius: 12px; border-left: 4px solid #00a884; text-align: left;">
                            <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #00a884; text-transform: uppercase;">Estado de la Conexión</h4>
                            <p style="margin: 0; font-size: 11px; color: #aebac1; font-family: monospace;">TOKEN_SAVED: SUCCESS</p>
                            <p style="margin: 3px 0 0 0; font-size: 11px; color: #aebac1; font-family: monospace;">CHANNEL_READY: TRUE</p>
                        </div>

                        <a href="/ops" style="display: inline-block; background: #00a884; color: #111b21; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-weight: 800; font-size: 14px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(0, 168, 132, 0.3);">
                            ENTRAR AL CRM
                        </a>
                        
                        <p style="margin-top: 25px; font-size: 12px; color: #667781;">
                            Ya puedes recibir y enviar mensajes desde la pestaña Operaciones.
                        </p>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (err: any) {
        console.error('❌ Server error during Instagram Auth:', err);
        return NextResponse.json({ error: 'Server error', message: err.message }, { status: 500 });
    }
}
