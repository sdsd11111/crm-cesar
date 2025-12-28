# GUÍA DE CONFIGURACIÓN: DONNA FIDELIZACIÓN DUAL

Esta guía te permitirá configurar todos los componentes externos necesarios para el Sistema de Fidelización IA Dual de forma autónoma.

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [x] Crear Bot de Telegram
- [x] Obtener API Key de DeepSeek
- [x] Configurar variables de entorno
- [x] Configurar ngrok con MFA
- [x] Configurar webhook de Telegram
- [ ] Verificar conexión completa

---

## 1️⃣ CONFIGURAR BOT DE TELEGRAM (✅ COMPLETADO)

✅ **Bot ya creado:** `@cesarobjetivo_bot`  
✅ **Token:** `7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk`  
✅ **Chat ID:** `2126922376`

### Verificación
1. Busca tu bot: **@cesarobjetivo_bot** en Telegram
2. Envíale `/start` para activarlo
3. Ya está listo para recibir tus audios y notas.

**🔗 Documentación oficial:** https://core.telegram.org/bots/tutorial

---

## 2️⃣ OBTENER API KEY DE DEEPSEEK

### Paso 1: Crear cuenta
1. Ve a: https://platform.deepseek.com/
2. Regístrate con tu email.
3. Verifica tu cuenta.

### Paso 2: Generar API Key
1. Accede al dashboard: https://platform.deepseek.com/api_keys
2. Haz clic en **"Create API Key"**
3. Dale un nombre descriptivo (ej: "CRM Donna Production")
4. **IMPORTANTE:** Copia la API Key inmediatamente (solo se muestra una vez). Se ve así:
   ```
   sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Paso 3: Revisar Pricing
- **Modelo recomendado:** `deepseek-reasoner` (para razonamiento complejo)
- **Costo aproximado:** ~$0.55 por millón de tokens de entrada
- **Presupuesto sugerido:** $10-20 USD/mes para empezar

**🔗 Pricing:** https://api-docs.deepseek.com/quick_start/pricing  
**🔗 API Docs:** https://api-docs.deepseek.com/

---

## 3️⃣ CONFIGURAR VARIABLES DE ENTORNO

### Paso 1: Abrir archivo `.env.local`
Ubicación: `CRM V2/.env.local`

### Paso 2: Agregar las siguientes variables
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk
TELEGRAM_CHAT_ID=2126922376

# DeepSeek API Configuration
DEEPSEEK_API_KEY=tu_api_key_de_deepseek_aqui
DEEPSEEK_MODEL=deepseek-reasoner
```

### Paso 3: Guardar y reiniciar el servidor
```bash
# Si el servidor está corriendo, detenerlo (Ctrl+C) y volver a iniciar:
npm run dev
```

---

## 4️⃣ CONFIGURAR WEBHOOK DE TELEGRAM

Para que el bot reciba tus mensajes automáticamente, necesitas configurar el webhook.

### Paso 1: Obtener la URL de tu CRM
Si estás en desarrollo local, necesitarás exponer tu servidor con **ngrok** o similar.

**Opción A: Producción (Vercel)**
```
https://tu-dominio-crm.vercel.app/api/telegram/webhook
```

**Opción B: Desarrollo Local (ngrok)**
1. Instala ngrok: https://ngrok.com/download
2. Ejecuta: `ngrok http 3000`
3. Copia la URL HTTPS que te da (ej: `https://abc123.ngrok.io`)
4. Tu webhook será: `https://abc123.ngrok.io/api/telegram/webhook`

### Paso 2: Registrar el webhook
Abre tu navegador y visita esta URL (reemplaza con tus datos):

```
https://api.telegram.org/bot7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk/setWebhook?url=TU_URL_DEL_WEBHOOK
```

**Ejemplo:**
```
https://api.telegram.org/bot7880774293:AAEm2iC20qyzOA2DVotzv1NDCD_e-uiFXpk/setWebhook?url=https://tu-crm.vercel.app/api/telegram/webhook
```

Deberías ver una respuesta como:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## 5️⃣ VERIFICAR CONEXIÓN

Una vez que hayas configurado todo, puedes probar la conexión enviando un mensaje de prueba al bot de Telegram. Si todo está bien configurado, el sistema debería responder.

---

## ⚠️ NOTAS DE SEGURIDAD

- **NUNCA** compartas tu `TELEGRAM_BOT_TOKEN` o `DEEPSEEK_API_KEY` públicamente.
- **NO** subas el archivo `.env.local` a GitHub (ya está en `.gitignore`).
- Si crees que una clave fue comprometida, regénérala inmediatamente desde el panel correspondiente.

---

## 📞 SOPORTE

Si tienes problemas con alguno de estos pasos, documenta el error exacto y consúltame.
