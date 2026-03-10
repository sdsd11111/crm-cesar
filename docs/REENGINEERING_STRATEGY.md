# 🚀 Estrategia de Reingeniería: CRM Objetivo V2

Este documento resume la transformación del CRM de una arquitectura monolítica a una modular, enfocada en la autonomía de canales y la escalabilidad del sistema de agentes (Donna).

## 🛠️ Cambios Implementados (Quick Wins)

1. **Modularización de Mensajería**:
   - `InternalNotificationService`: Centraliza comunicaciones internas vía Telegram (César/Abel).
   - `CustomerMessagingService`: Orquestador omnicanal para clientes (WhatsApp/Instagram) con lógica de humanización integrada.
   - `MessagingService`: Refactorizado como registro de adaptadores ligero.

2. **Desacoplamiento del Cerebro (Cortex)**:
   - `CortexRouterService`: Se redujo la complejidad eliminando lógica de transporte y logging redundante. Ahora solo se encarga de la intención de la IA.
   - `EntityResolverService`: Ya no depende de callbacks de Telegram, usa el servicio de notificaciones internas.

3. **Optimización de Notificaciones**:
   - `notification_worker.ts`: Ahora consume el servicio modular, garantizando que los recordatorios sigan las mismas reglas que el resto del sistema.

## 🏮 Arquitectura de Destino (V3 Dream)

| Componente | Responsabilidad | Canal |
| --- | --- | --- |
| **Donna Macro** | Análisis de KPIs y tendencias globales. | Dashboard / Telegram |
| **Donna Agent** | Relación 1-a-1 con leads y clientes. | WhatsApp / Instagram |
| **Core Router** | Enrutamiento de intenciones a handlers. | Agnóstico |
| **Messaging Hub** | Adaptadores (Evolution, Meta, Telegram). | Plug & Play |

## 🧠 Master Rules de Oro (Actualizadas)

- **DRY (Don't Repeat Yourself)**: Si Donna saluda en WhatsApp y en Instagram, la lógica de saludo vive en un prompt único, no en el adaptador.
- **Canal de Verdad**: La tabla `contacts` es el origen de la verdad para el canal preferido del usuario.
- **Silencio es Oro**: El bot solo interviene si su modo es `active`. Ante cualquier duda, pausa automática (`botMode: paused`) y alerta a César.

---
*Este informe fue generado tras la auditoría técnica de Febrero 2026.*
