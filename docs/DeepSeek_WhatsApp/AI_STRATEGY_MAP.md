# Mapa de Estrategia de IA (AI Strategy Map)

Este documento define **conscientemente** qué modelo de IA controla cada flujo del sistema, priorizando el "Razonamiento" (DeepSeek R1) para tareas cognitivas complejas y "Estándar/Rápido" (GPT-4o/DeepSeek V3) para ejecución directa.

## Principios de Diseño
1.  **Razonamiento (DeepSeek R1):** Se usa cuando la IA debe "pensar antes de hablar". Ideal para análisis, toma de decisiones, desenredo de ambigüedades y estrategia.
2.  **Estándar (GPT-4o / DeepSeek V3):** Se usa cuando la IA debe seguir instrucciones precisas, formatear datos (JSON) o realizar tareas creativas simples donde la velocidad importa.
3.  **Especializado (Whisper):** Transcripción de audio.

## Tabla de Asignación de Modelos

| Módulo | Función Específica | Modelo Propuesto | Justificación | Nivel de Complejidad |
| :--- | :--- | :--- | :--- | :--- |
| **Donna Cortex** | **Router & Brain:** Analizar intención del usuario, resolver entidades y decidir ruta (SQL vs Calendar vs WhatsApp). | **🧠 DeepSeek R1 (Reasoner)** | La lógica de decisión requiere distinguir matices ("cancelar" vs "avisar") y manejar ambigüedad. Es el "cerebro" del sistema. | 🔴 Alta |
| **Entrenador (Trainer)** | **Analista:** Evaluar transcripciones de llamadas, detectar psicometría y dar feedback. | **🧠 DeepSeek R1 (Reasoner)** | Evaluar desempeño humano requiere entender contexto profundo y "razonar" como un gerente de ventas. | 🔴 Alta |
| **Entrenador (Coach)** | **Estratega:** Generar los 4 escenarios de pitch (Dueño, Recepción, etc.). | **🧠 DeepSeek R1 (Reasoner)** | Requiere planificación estratégica simulada para anticipar objeciones. | 🔴 Alta |
| **Cotizaciones** | **Redactor Pro:** Generar propuestas comerciales completas (`generateFullQuotation`). | **🧠 DeepSeek R1 (Reasoner)** | Una propuesta persuasiva debe argumentar lógicamente por qué el cliente debe comprar, no solo llenar huecos. | 🟠 Media/Alta |
| **Cotizaciones** | **Asistente:** Generar descripciones cortas (`generateDescription`). | **⚡ Estándar (GPT-4o / V3)** | Tarea de redacción directa y breve. El razonamiento excesivo aquí sería lento e innecesario. | 🟢 Baja |
| **Chat General** | **Conversación:** Respuestas rápidas en chat (`agent/chat`). | **⚡ Estándar (DeepSeek V3)** | El chat fluido requiere baja latencia. V3 es excelente para conversación natural. | 🟢 Baja |
| **Transcripción** | **Oído:** Convertir audio a texto. | **👂 Whisper-1** | Modelo estándar de industria para audio. | ⚪ N/A |

## Plan Técnico: "Selector de Inteligencia"

Para implementar esto sin "dejar que el sistema decida solo", refactorizaremos `lib/openai/client.ts` para que exponga clientes por **INTENCIÓN**, no por proveedor.

```typescript
// Diseño Propuesto para lib/ai/metrics.ts (o client.ts actualizado)

type AIIntent = 'REASONING' | 'STANDARD' | 'AUDIO';

export function getAIClient(intent: AIIntent) {
    switch(intent) {
        case 'REASONING':
             // Retorna cliente configurado con DeepSeek R1
             // BaseURL: https://api.deepseek.com
             // Model: deepseek-reasoner
             return deepseekClient; 
             
        case 'STANDARD':
             // Retorna cliente configurado con GPT-4o o DeepSeek V3 (Chat)
             return standardClient;
             
        case 'AUDIO':
             return openaiClient; // Whisper
    }
}
```

### Ventaja
En el código de `CortexRouterService.ts`, en lugar de:
`if (provider === 'openai') ...`

Escribiremos explícitamente:
`const ai = getAIClient('REASONING');`

Esto garantiza que **nosotros** controlamos quién piensa y quién ejecuta.
