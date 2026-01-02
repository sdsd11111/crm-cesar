# 🧠 CRM OBJETIVO: REGLAS MAESTRAS DE OPERACIÓN (MASTER RULES)

Este documento es la **fuente única de verdad** para cualquier instancia de Antigravity. Debe leerse ANTES de proponer cualquier cambio al código.

## 1. Arquitectura de Datos (Prohibido Duplicar)
- **Tabla MASTER:** `contacts` es el destino final de Prospectos, Leads y Clientes.
- **Tabla SACRA:** `discovery_leads` contiene datos crudos. **NUNCA** se debe intentar unificar con `contacts`. 
- **Mapeo de Identidad (ID Ghost):** Al convertir un `discovery_lead` a `contact`, el ID original de discovery DEBE guardarse en `contacts.discovery_lead_id`. Esto es vital para que las "Donna Agents" puedan consultar el pasado de investigación fría sin escanear toda la tabla.
- **Identificadores:** Siempre usar UUIDs. Nunca basar relaciones en nombres comerciales o teléfonos (pueden cambiar/duplicarse).

## 2. Consolidación de Investigación (Discovery)
- **Columna Única:** Usar `research_data` (JSONB) para toda la información extraída por IA o Scraping.
- **Columnas Depreciadas:** `investigacion`, `booking_info`, `google_info`. **IMPORTANTE:** No eliminar campos hasta que una migración mueva los datos a `research_data`. El código nuevo DEBE leer de `research_data` con fallback a las antiguas si el campo está vacío.
- **Donna Visión:** El acceso a Discovery debe ser por ID directo (`discovery_lead_id`) o filtrado por status `investigated` / etiquetas de interés.

## 3. Integración de WhatsApp (Evolution API)
- **Flujo:** La verdad de los mensajes vive en Evolution API.
- **Interacciones:** Cada mensaje enviado/recibido DEBE reflejarse en la tabla `interactions`.
- **Automatización:** Preferir Webhooks de Evolution API hacia un endpoint del CRM (`/api/webhooks/whatsapp`) para que Donna sea reactiva, en lugar de inserciones manuales desde la UI.

## 4. Ecosistema Donna (Dualidad)
- **Donna Macro:** Asistente global. Analiza estadísticas, KPIs y tendencias de todo el CRM.
- **Donna Agent:** Un agente específico por cada Lead/Cliente. Su universo es un solo ID.
- **Lógica de Control:**
    - **Prompts:** Todos los mensajes y recordatorios se basan en archivos .md en `/lib/donna/prompts/`. **PROHIBIDA** la improvisación total de la IA sin seguir estas plantillas.
    - **Flujo de Aprobación:** Donna propone -> Humano aprueba vía Telegram (interno) o Interfaz -> Donna ejecuta (WhatsApp).
    - **Psicología:** Tono profesional, directo, asertivo (Closer). Reducir fricción, no crear ruido.
- **Recordatorios:** Basarse en UTC-5 (Ecuador) y procesarse vía `PlanningEngine`.

## 5. Desarrollo Lean & DRY
- **Componentes:** Si una lógica se usa en Lead y Cliente, **DEBE** ser un componente compartido en `components/shared/sales`. Prohibido el copy-paste de páginas completas.
- **APIs:** Preferir rutas polimórficas (Ej: `/api/whatsapp/chats/[id]/details`) que manejen el `entityType` ('contact' o 'discovery') dinámicamente.
- **Referencia UX:** La `app/whatsapp/page.tsx` es el estándar de oro para interfaces operativas de alta densidad.

## 6. Consola de Operaciones 360° (UX Pro)
- **Layout de 3 Columnas:** El centro operativo (WhatsApp) DEBE mantener una estructura de 3 niveles: Navegación (Izquierda), Conversación (Centro), e inteligencia de Negocio (Derecha).
- **Ficha 360° Editable:** El panel derecho DEBE mostrar todos los campos de la DB mediante `Accordions` y permitir la edición in-situ sin navegación.
- **Sincronización Obligatoria:** Todo agendamiento de eventos DEBE pasar por la sincronización de Google Calendar para centralizar la disponibilidad y generar links de Meet automáticamente.
- **Propuestas IA:** La generación de estrategias debe compartir el contexto del `TrainerEngine` pero ejecutarse desde el panel de Seguimiento Pro.

## 7. Manejo Unificado de Tiempo (Zonas Horarias)
- **Timezone de Operación:** El CRM opera estrictamente bajo `America/Guayaquil` (UTC-5).
- **Consistencia de Datos:** Todas las fechas mostradas en UI, procesadas por IA (Donna) o filtradas en DB deben ser normalizadas a esta zona horaria usando `date-fns-tz`.
- **Parsing de IA:** Los motores de procesamiento (Cortex, Planning) DEBEN recibir la fecha y hora actual de Ecuador en cada prompt para evitar desvíos temporales ("Ayer" vs "Hoy").
- **Historial:** Al consultar historial conversacional, el filtro de "Mismo Día" debe calcularse basándose en el calendario de Ecuador, no en la zona horaria del servidor (que suele ser UTC).
