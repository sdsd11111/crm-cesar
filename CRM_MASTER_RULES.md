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
- **APIs:** Preferir rutas dinámicas que manejen el tipo de contacto en lugar de crear endpoints `api/leads` y `api/clients` idénticos.
