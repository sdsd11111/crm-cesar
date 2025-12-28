# Modelo de Datos: Donna & CRM Estratégico

Este documento detalla la estructura y relaciones de las entidades que alimentan el cerebro de Donna.

## Diagrama de Relaciones (Donna Core)

```mermaid
erDiagram
    CONTACTS ||--|| AGENTS : "tiene un Micro-Agente"
    CONTACTS ||--o{ INTERACTIONS : "historial clínico"
    CONTACTS ||--o{ LOYALTY_MISSIONS : "propuestas tácticas"
    CONTACTS ||--o{ WHATSAPP_LOGS : "auditoría"
    
    AGENTS ||--o{ AGENT_BRIEFINGS : "preparación reuniones"
    AGENTS ||--o{ COMMITMENTS : "registro de promesas"

    CONTACTS {
        uuid id PK
        text entity_type "prospect, lead, client"
        text business_type "Restaurante, Hotel, etc."
        text connection_type "Tipo de Relación"
        timestamp birthday "Memoria Personal"
        timestamp anniversary_date "Memoria de Negocio"
        boolean whatsapp_opt_out "Seguridad"
        float contract_value "Solo para Clientes"
    }

    AGENTS {
        uuid id PK
        uuid contact_id FK
        int current_risk_score "Termómetro de relación"
        jsonb reliability_stats "Puntaje de cumplimiento"
        timestamp last_planned_at "Control de Cooldown"
    }

    LOYALTY_MISSIONS {
        uuid id PK
        uuid contact_id FK
        text status "pending, approved, executed"
        text content "Propuesta de la IA"
        jsonb metadata "Contexto del evento"
    }

    WHATSAPP_LOGS {
        uuid id PK
        uuid contact_id FK
        text status "sent, failed"
        text content "Mensaje real enviado"
        timestamp created_at "Timestamp anti-ban"
    }
```

## Descripción de Tablas Clave

### 1. `contacts` (El Sujeto)
Es la tabla maestra. Donna lee esta tabla no solo para saber quién es el cliente, sino para detectar **eventos gatillo** (cumpleaños, aniversarios o cambios de ciudad).

### 2. `agents` (Donna Micro)
Es el "perfil psicológico" del cliente. Aquí es donde Donna guarda qué tan confiable es el cliente (sus promesas cumplidas vs rotas) y cuándo fue la última vez que se le realizó un análisis profundo (`last_planned_at`).

### 3. `interactions` (La Memoria)
Es la fuente de la **Resiliencia de Memoria**. Donna lee las últimas 10 entradas de aquí para entender el contexto actual y no confundirse con información vieja (Timeline Paradox).

### 4. `loyalty_missions` (La Acción)
Aquí viven las misiones sugeridas. Una misión no se envía hasta que un humano (César o Abel) la aprueba en el módulo de Donna.

### 5. `whatsapp_logs` (Seguridad)
Es el libro de auditoría. Centraliza todo lo enviado para garantizar que sigamos las reglas anti-ban (ventanas de tiempo y límites de velocidad).

---

> [!TIP]
> **Donna Macro** escanea todas estas tablas en conjunto para generar reportes estratégicos, mientras que **Donna Micro** se enfoca exclusivamente en un ID de `contact_id` a la vez.
