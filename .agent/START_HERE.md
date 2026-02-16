# 🚩 ANCLA DE CONTEXTO: SISTEMA NEURONAL V2 (READ ME FIRST)

**PARA EL ASISTENTE DE IA:**
Este documento es la **LEY ABSOLUTA**. Si intentas modificar código sin leer esto primero, romperás la arquitectura delicada de "Single Writer" y "Alejandra Gateway".

---

## 🔐 1. REGLA DE ORO: EL GATEWAY DE ALEJANDRA
El flujo de mensajes es **ESTRICTO** y **UNIDIRECCIONAL** para proteger el contexto.

1.  **Entrada Cruda**: `Webhook` → `Queue` → `Worker` → **[Alejandra]**
    *   **SOLO Alejandra** tiene permiso de leer el `input.text` crudo del cliente.
    *   Su trabajo es **clasificar, sanitizar y traducir** la intención del cliente a un "Comando Interno".

2.  **Distribución a Expertos**:
    *   Alejandra genera un `Internal Digest` (ej: "Cliente pide cotización de X").
    *   **CortexRouter** inyecta **SOLO** este `digest` en los prompts de los expertos (`{{INTERNAL_DIGEST}}`).
    *   **NUNCA** pases el mensaje original a César, Abel o Ventas. Ellos actúan sobre la *interpretación* de Alejandra.

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

## 🧪 3. PROTOCOLO DE TESTING
Si vas a realizar pruebas con el número del desarrollador (César):

1.  **Activa el Escudo**: Asegúrate de que `DISABLE_MESSAGE_PERSISTENCE=true` en `.env.local`.
2.  **Verifica los Logs**: Debes ver `[PERSISTENCE DISABLED] Skipping save...` en la consola.
3.  **Flujo Real**: Aunque no se guarde en BD, el mensaje **SÍ** debe viajar por el `Queue` → `Worker` → `Alejandra` → `Respuesta`.

---

## 📚 Documentación Maestra
*   **Archivos Críticos**: `scripts/message_worker.ts`, `lib/donna/services/CortexRouterService.ts`, `lib/whatsapp/WhatsAppService.ts`
*   **Reglas de Negocio**: `CRM_MASTER_RULES.md`
*   **Arquitectura**: `docs/MASTER_CONTEXT/PROJECT_CONSOLIDATED_STATE.md`

**SI ROMPES ESTAS REGLAS, ROMPES LA MEMORIA DE DONNA.**
