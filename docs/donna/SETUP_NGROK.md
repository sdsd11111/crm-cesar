# GUÍA PASO A PASO: CONFIGURAR NGROK EN WINDOWS

## Paso 1: Registrarte en ngrok (NECESARIO)
Ngrok requiere una cuenta gratuita:

1. Ve a: https://dashboard.ngrok.com/signup
2. Regístrate con tu email
3. Una vez dentro, copia tu **authtoken** (lo verás en el dashboard)

## Paso 2: Abrir PowerShell como Administrador
1. Presiona **Windows + X**
2. Selecciona **"Windows PowerShell (Administrador)"** o **"Terminal (Administrador)"**

## Paso 3: Navegar a la carpeta de ngrok
En PowerShell, escribe:
```powershell
cd C:\ngrok-v3-stable-windows-amd64
```
(Ajusta la ruta si extrajiste ngrok en otro lugar)

## Paso 4: Autenticar ngrok (SOLO UNA VEZ)
```powershell
.\ngrok config add-authtoken TU_AUTHTOKEN_AQUI
```
Reemplaza `TU_AUTHTOKEN_AQUI` con el token que copiaste del dashboard.

## Paso 5: Ejecutar ngrok
```powershell
.\ngrok http 3000
```

## Paso 6: Copiar la URL
Verás algo como:
```
Forwarding   https://abc123-456-789.ngrok-free.app -> http://localhost:3000
```

**Copia la URL HTTPS** (la parte `https://abc123...ngrok-free.app`)

## Paso 7: Configurar el webhook de Telegram
Abre tu navegador y pega (reemplaza `TU-URL-NGROK`):
```
https://api.telegram.org/bot7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk/setWebhook?url=TU-URL-NGROK/api/telegram/webhook
```

**Ejemplo:**
```
https://api.telegram.org/bot7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk/setWebhook?url=https://abc123.ngrok-free.app/api/telegram/webhook
```

Deberías ver: `{"ok":true,"result":true}`

## Paso 8: Probar
1. Ve a Telegram
2. Busca `@cesarobjetivo_bot`
3. Envía: `El compadre Claudio me pidió cambiar el logo`
4. Revisa la consola de `npm run dev` para ver si llega

## IMPORTANTE
- NO cierres la ventana de PowerShell donde corre ngrok
- Cada vez que reinicies ngrok, la URL cambiará (repite Paso 7)
