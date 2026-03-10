# 🗓️ Guía: Integración de Google Calendar con Donna (Vercel Edition)

Entiendo la confusión. El aviso de **Client ID / Secret** es típico de tutoriales de OAuth2, pero tu CRM actual está usando una **Cuenta de Servicio** (Service Account), que es mucho más estable para procesos automáticos de IA como los de Donna.

## 1. Dónde están tus credenciales actuales
Mis protocolos de seguridad me impiden leer directamente tus archivos secretos (`.env.local` y `google_credentials.json`), pero tú los tienes ahí mismo. Copia estos valores:

1.  **El archivo JSON:** Busca en la raíz de este proyecto el archivo `google_credentials.json`.
2.  **La Variable de Entorno:** Abre tu `.env.local` y busca la variable:
    `GOOGLE_CALENDAR_CREDENTIALS`
    *(Es un string largo que contiene todo el JSON de arriba en una sola línea).*

## 2. Configurar en el NUEVO proyecto (en Vercel)
Para que Donna funcione en Vercel sin depender de tu computadora local:

1.  **Copia el JSON:** Toma el contenido de `google_credentials.json`.
2.  **Variable en Vercel:** Ve al panel de Vercel de tu nuevo proyecto > Settings > Environment Variables.
3.  **Crea `GOOGLE_CALENDAR_CREDENTIALS`:** Pega el contenido del JSON completo como valor.

## 3. ¿Qué pasa con el Redirect URI y Localhost?
Si ves avisos de `localhost`, es porque el código está intentando usar el flujo de "Login" (OAuth2). 

- **Si usas Cuenta de Servicio (Recomendado):** NO necesitas Redirect URI. Donna entra directo con su "llave" JSON.
- **Si insistes en usar Client ID / Secret (OAuth2):** 
    *   Debes ir a [Google Cloud Console](https://console.cloud.google.com/).
    *   En **Redireccionamiento autorizado**, cambia `http://localhost:3000/...` por `https://tu-proyecto-donna.vercel.app/api/auth/callback/google`.
    *   **Sin este cambio, NUNCA funcionará desde la nube.**

## 4. Archivos para Donna
Asegúrate de llevar estos archivos a tu nuevo proyecto para que herede la lógica que ya funciona:
- `lib/google/CalendarService.ts`: Este es el motor que ya sabe leer el JSON y agendar.
- `app/api/events/route.ts`: El endpoint que Donna llamará para insertar recordatorios.

---
> [!IMPORTANT]
> **Mi consejo:** Usa la **Cuenta de Servicio**. Simplemente copia el contenido de `google_credentials.json` a las variables de entorno de Vercel y Donna tendrá acceso total e inmediato.
