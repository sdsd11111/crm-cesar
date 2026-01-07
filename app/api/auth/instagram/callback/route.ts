
import { NextRequest, NextResponse } from 'next/server';

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

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

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

        // 3. Return a friendly UI with instructions
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff;">
                    <div style="background: #111; padding: 2rem; border-radius: 12px; border: 1px solid #333; text-align: center; max-width: 500px;">
                        <h2 style="color: #E1306C;">📸 Instagram Conectado!</h2>
                        <p>El token de acceso se ha generado correctamente.</p>
                        <div style="background: #222; padding: 10px; border-radius: 6px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 12px; border: 1px dashed #555;">
                            ${finalToken}
                        </div>
                        <p style="font-size: 14px; color: #888;">Copia este token y actualiza tu variable <b>INSTAGRAM_ACCESS_TOKEN</b> en Vercel para que todo esté listo.</p>
                        <a href="/ops" style="display: inline-block; background: #E1306C; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Volver al CRM</a>
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
