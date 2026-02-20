# 🚩 ANCLA DE CONTEXTO: SISTEMA NEURONAL V2 (READ ME FIRST)

**PARA EL ASISTENTE DE IA:**
Este documento es la **LEY ABSOLUTA**. Si intentas modificar código sin leer esto primero, romperás la arquitectura delicada de "Single Writer" y "Alejandra Gateway".

---

## 🔐 1. REGLA DE ORO: EL GATEWAY DE ALEJANDRA
El flujo de mensajes es **ESTRICTO** y **UNIDIRECCIONAL** para proteger el contexto.

1.  **Entrada Cruda (Webhook Timeout Protection)**: `Webhook` → `Queue` → `Worker` → **[Alejandra]**
    *   **SOLO Alejandra** tiene permiso de leer el `input.text` crudo del cliente.
    *   Su trabajo es **clasificar, sanitizar y traducir** la intención del cliente a un "Comando Interno".
    *   **Evadir Timeouts de Meta**: Para flujos pesados (ej. Cotizaciones), el `CortexRouter` despacha inmediatamente un *"⏳ Dame un minuto..."* para no colgar el Webhook mientras el LLM redacta.

2.  **Seguridad y Distribución a Expertos**:
    *   **Separación de Roles (Prompt Injection)**: Todos los LLMs reciben sus instrucciones como `role: "system"` y la data del cliente escrupulosamente separada como `role: "user"`. NUNCA inyectar crudo en el System Prompt.
    *   **Salidas JSON Estrictas**: Uso obligatorio de `response_format: { type: "json_object" }` en Fast Models para evitar parseos con expresiones regulares rompedizas.
    *   Alejandra genera un `Internal Digest` (ej: "Cliente pide cotización de X").
    *   **CortexRouter** inyecta **SOLO** este `digest` en los prompts de los expertos.
    *   Los teléfonos de Administración (César/Abel) ahora son leídos obligatoriamente desde `.env.local` (`CESAR_PHONE`, `ABEL_PHONE`). Ya NO están quemados en el código.

---

## 💾 2. REGLA DE ORO: PERSISTENCIA "SINGLE WRITER"
Para evitar duplicidad y bucles infinitos, la escritura en base de datos está centralizada.

1.  **Worker (Escritor Único)**:
    *   Es el **ÚNICO** autorizado para hacer `INSERT` en `donna_chat_messages`.
    *   Guarda el mensaje del `user` (User Input).
    *   Guarda la respuesta del `assistant` (AI Response).
    *   Si `DISABLE_MESSAGE_PERSISTENCE=true`, **NO GUARDA NADA** (Modo Testing).

2.  **WhatsAppService (Solo Transporte)**:
    *   Su única función es enviar mensajes a la API de Meta.
    *   **PROHIBIDO** hacer inserts en `donna_chat_messages` o `whatsapp_logs`.
    *   Solo puede escribir en `interactions` para auditoría técnica (timestamp, status).

---

## 📄 3. PRODUCCIÓN DE DOCUMENTOS: UNIVERSAL PDF SERVICE
Donna ahora es un agente "Productor de Documentos", no solo un chatbot.

1.  **Motor de Renderizado**:
    *   Usa `PdfDocumentService.ts` + `UniversalPdfDocument.tsx`.
    *   **Regla de Activos**: Los logos y firmas deben ser rutas locales absolutas (vía `path.join(process.cwd(), 'public', ...)`) para que `@react-pdf/renderer` los procese correctamente en el backend.

2.  **Flujo de Entrega (Meta CDN)**:
    *   **Generar** (Markdown) → **Renderizar** (Buffer) → **Subir** (Meta ID) → **Enviar** (Document).
    *   **NUNCA** envíes el PDF como un link público de S3/GCP; siempre usa `uploadMedia` de `whatsappService` para enviarlo como un archivo nativo adjunto.

3.  **Intenciones Especializadas**:
    *   `COTIZACION`: Activa el calificador (`quotation_qualifier.md`) si falta contexto.
    *   `CONTRATO`: Activa el motor de contratos con líneas de firma obligatorias.

---

## 🧪 4. PROTOCOLO DE TESTING
Si vas a realizar pruebas con el número del desarrollador (César):

1.  **Activa el Escudo**: Asegúrate de que `DISABLE_MESSAGE_PERSISTENCE=true` en `.env.local`.
2.  **Verifica los Logs**: Debes ver `[PERSISTENCE DISABLED] Skipping save...` en la consola.
3.  **Flujo Real**: Aunque no se guarde en BD, el mensaje **SÍ** debe viajar por el `Queue` → `Worker` → `Alejandra` → `Respuesta`.

---

## 📚 Documentación Maestra
*   **Archivos Críticos**: `scripts/message_worker.ts`, `lib/donna/services/CortexRouterService.ts`, `lib/whatsapp/WhatsAppService.ts`
*   **Reglas de Negocio**: `CRM_MASTER_RULES.md`
*   **Arquitectura**: `docs/MASTER_CONTEXT/PROJECT_CONSOLIDATED_STATE.md`

---

## 🚀 Hitos Recientes (Febrero 2026)
*   **Seguridad de Arquitectura IA**: Se estableció JSON explícito, roles System/User para blindar inyección de prompts y soporte de webhook buffering inmediato.
*   **Generación Universal de PDFs**: Implementado motor basado en `@react-pdf/renderer` para Cotizaciones y Contratos.
*   **Integración WhatsApp Media**: Donna sube los PDFs directamente al CDN de Meta como anexos nativos.
*   **Handover al Humano**: Implementación del parámetro estricto `"handover": boolean` para pausar bots agresivos/confusos.
