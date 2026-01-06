# Guía de Conexión Meta WhatsApp (WABA) 🚀

Esta guía detalla los pasos críticos para activar la recepción de mensajes (Webhooks) y asegurar que el CRM esté correctamente vinculado con la cuenta de WhatsApp Business.

## 1. Identificación de IDs Críticos
Para que el CRM funcione, necesitas 3 valores en el archivo `.env`:
*   `META_WA_ACCESS_TOKEN`: Token permanente de sistema.
*   `META_WA_PHONE_NUMBER_ID`: ID del número de teléfono (no el número en sí).
*   `META_WA_VERIFY_TOKEN`: Un string aleatorio (ej: `my_secure_token_123`) que debe coincidir en Meta y en el CRM.

## 2. El Paso Maestro: Suscripción de la WABA
Incluso si el Webhook está verificado (HTTP 200), **Meta no enviará mensajes reales** si la App no está explícitamente "suscrita" a la cuenta de WhatsApp.

### Cómo suscribirse vía Graph API Explorer:
1.  Ve al [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2.  Selecciona tu **App de Meta**.
3.  Genera un **Access Token** con permisos `whatsapp_business_management`.
4.  Identifica tu **WABA ID** (WhatsApp Business Account ID) en el [WhatsApp Manager](https://business.facebook.com/wa/manage/home/).
5.  En la barra de URL del Explorer, pon: `ID_DE_TU_WABA/subscribed_apps`.
6.  Cambia el método de `GET` a **`POST`**.
7.  Haz clic en **Enviar**. Debes recibir `{"success": true}`.

## 3. Configuración del Webhook en Meta
En el panel de la App de Meta -> WhatsApp -> Configuración:
*   **Callback URL**: `https://tu-dominio.vercel.app/api/webhooks/whatsapp`
*   **Verify Token**: El valor de `META_WA_VERIFY_TOKEN`.
*   **Campos de suscripción**: Debes entrar en "Webhooks" (menú lateral) -> Objeto "WhatsApp Business Account" y suscribirte **obligatoriamente** al campo `messages`.

## 4. Mejores Prácticas para Link Previews
Para que los links enviados desde el CRM muestren una imagen destacada (Authority):
*   El link **debe estar al final** del mensaje.
*   La página de destino **debe tener meta tags Open Graph** (`og:image`, `og:title`).
*   Meta tarda unos segundos en procesar el crawler; el primer mensaje a un número nuevo a veces no muestra el preview instantáneamente.

## 5. Notas de Desarrollo vs Producción
*   **Modo Desarrollo**: Solo recibes webhooks de números registrados como "Testers" en la App.
*   **Modo En Vivo**: Recibes mensajes de cualquier persona, pero requiere que la App esté en modo "Live" en Meta.
