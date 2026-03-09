# Documentación de Modelos de Datos para Donna

Este documento detalla los esquemas exactos (tablas) de Drizzle ORM que definen la estructura core del CRM para la gestión de entidades y documentos comerciales. Como agente autónomo, debes adherirte a estos modelos al consultar o insertar datos.

## 1. Contactos, Leads y Clientes
El sistema utiliza un enfoque de entidad unificada (`contacts`) y tablas históricas separadas por etapa del funnel (`prospects`, `leads`, `clients`).

### Tabla: `contacts` (Entidad Unificada)
Es la tabla principal que almacena cualquier persona u organización que interactúe con el CRM.
- **Campos Obligatorios:**
  - `entityType` (enum: `'prospect'`, `'lead'`, `'client'`) - Define la etapa del contacto.
  - `businessName` (text) - Nombre de la empresa o negocio.
  - `contactName` (text) - Nombre de la persona de contacto.
- **Campos Clave a Actualizar:**
  - `status`: Estado actual del seguimiento.
  - `phase`: Fase numérica del embudo (por defecto `1`).
  - `quotation` (text): Campo de texto / JSON donde se registra el resumen de la cotización actual, en caso de estar simplificada.
  - `botMode` (enum: `'active'`, `'paused'`, `'disabled'`): Si estás hablando por Telegram o WhatsApp, revisar esto.

### Tabla: `leads`
Almacena leads calificados, generalmente con interacciones de Recorridos.
- **Campos Obligatorios:** `businessName`, `contactName`.
- **Campos Diagnóstico (Importantes para cotizar):**
  - `interestedProduct`, `businessActivity`, `quantifiedProblem`, `conservativeGoal`, `averageTicket`, `pains`, `goals`. 
- **Estado (status):** `enum: ['sin_contacto', 'primer_contacto', 'segundo_contacto', 'tercer_contacto', 'cotizado', 'convertido']`.

### Tabla: `clients`
Almacena negocios ya cerrados.
- **Campos Obligatorios:** `businessName`, `contactName`.
- **Campos Clave Adicionales:** `contractValue` (doublePrecision), `contractStartDate` (timestamp), `leadId` (relación al lead original).

## 2. Cotizaciones (Quotations)
Tabla: `quotations`
Esta tabla registra las cotizaciones generadas de manera desglosada y profesional.
- **Campos Obligatorios:**
  - `title` (text) - Título de la propuesta.
- **Campos de Estructura de la Cotización:**
  - `leadId` (uuid) - Relación con la tabla `leads`.
  - `status` (enum: `'draft'`, `'sent'`, `'approved'`, `'rejected'`) - Estado de la cotización. Por defecto `'draft'`.
  - `introduction` (text) - Texto introductorio.
  - `valueProposition` (text) - La propuesta de valor central.
  - `roiClosing` (text) - Cierre enfocado en Retorno de Inversión (ROI).
  - `mentalTrigger` (text) - Gatillo mental a usar.
  - `selectedServices` (text/JSON) - Array convertido a texto conteniendo los servicios seleccionados.
  - `totalAmount` (doublePrecision) - Monto total.

## 3. Contratos (Contracts)
Tabla: `contracts`
Almacena los contratos formales para clientes.
- **Campos Obligatorios:**
  - `title` (text) - Título del contrato.
- **Campos Claves:**
  - `clientId` (uuid) - El cliente al que se asocia (Referencia a la tabla `clients`).
  - `leadId` (uuid) - Opcional.
  - `status` (enum: `'draft'`, `'pending_signature'`, `'signed'`, `'void'`). P.D.: `'draft'`.
  - `contractData` (text) - JSON stringificado con toda la información clave rellenada del contrato (nombres, montos, cláusulas clave).
  - `pdfUrl` (text) - Enlace al PDF si ya se ha generado.
  - `signedAt` (timestamp), `signedBy` (text) - Información de la firma.

### Plantillas de Contrato
Tabla: `contract_templates`
Contiene las bases para generar contratos.
- `slug` (text) - Identificador único (ej. `marketing-mensual`).
- `fields` (jsonb) - Array de objetos que define qué campos dinámicos necesita el contrato (ej. `[{id, label, type, options, defaultValue, placeholder, required}]`).
- `contentTemplate` (text) - Markdown o texto que contiene variables en formato `{{CAMPO}}` (ej. `{{businessName}}`).
