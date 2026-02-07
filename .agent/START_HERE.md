# 🚩 REGLA DE INICIO (READ ME FIRST)

**PARA EL ASISTENTE DE IA:**
Antes de realizar cualquier análisis o cambio, debes leer y asimilar el contenido de los siguientes documentos para garantizar la continuidad del proyecto y el respeto a las reglas maestras:

1. **`docs/MASTER_CONTEXT/PROJECT_CONSOLIDATED_STATE.md`**: Resumen técnico completo, arquitectura actual y deudas técnicas.
2. **`CRM_MASTER_RULES.md`**: Reglas de oro sobre la base de datos y comportamiento Donna.

**PROTOCOLOS OBLIGATORIOS:**
- **Zona Horaria**: Siempre usa `America/Guayaquil` (UTC-5).
- **Consistencia**: No crees nuevas tablas sin verificar si `contacts` puede absorber el dato.
- **Diseño**: Si creas UI, debe ser de alta fidelidad (premium). No hagas MVPs simples.
- **Mensajería**: Usa siempre el `InternalNotificationService` para alertas al equipo y `CustomerMessagingService` para clientes.

*Este archivo es la "Ancla de Contexto" para Antigravity.*
