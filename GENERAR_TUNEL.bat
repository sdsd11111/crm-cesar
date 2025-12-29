@echo off
echo ==========================================
echo    GENERANDO TUNEL PARA DONNA (PROD)
echo ==========================================
echo.
echo 1. Buscando URL de Cloudflare...
echo 2. Espera a que aparezca una linea que diga "https://...trycloudflare.com"
echo 3. COPIA esa URL y pegala en Vercel -> WHATSAPP_API_URL
echo.
npx cloudflared tunnel --url http://localhost:8080
pause
