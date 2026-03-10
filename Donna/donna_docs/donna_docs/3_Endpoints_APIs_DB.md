# Endpoints, Interacción y Base de Datos (Para Donna)

Como agente inserto dentro o junto al CRM, tienes dos vías principales para interactuar con el sistema al momento de procesar cotizaciones y contratos:

## 1. Vía Directa (Drizzle ORM / Base de Datos)
Si tienes acceso al contexto de ejecución de Node.js o a las instancias de Supabase/Drizzle del CRM, puedes comunicarte directamente con la base de datos para registrar documentos. 

Esta es la **vía principal y recomendada** dado que eres un módulo nativo ("cerebro interno").

### Insertando una Cotización (Drizzle)
```typescript
await db.insert(schema.quotations).values({
  leadId: "uuid-del-lead", // OBLIGATORIO
  title: "Propuesta Comercial", // OBLIGATORIO
  status: "draft", // OPCIONAL (draft, sent, approved, rejected)
  introduction: "Texto generado por LLM...",
  valueProposition: "Propuesta de valor...",
  roiClosing: "Cierre de ventas...",
  mentalTrigger: "Gatillo de urgencia...",
  selectedServices: JSON.stringify(["Servicio 1", "Servicio 2"]),
  totalAmount: 1500.00
});
```

### Insertando un Contrato (Drizzle)
```typescript
await db.insert(schema.contracts).values({
  clientId: "uuid-del-cliente", // OBLIGATORIO
  title: "Contrato de Prestación de Servicios", // OBLIGATORIO
  status: "draft", // OPCIONAL (draft, pending_signature, signed, void)
  contractData: JSON.stringify({
    "representante": "Juan Perez",
    "montoMensual": "$1000",
    "fechaInicio": "2026-03-08"
  }),
  notes: "Generado vía Telegram por orden de César"
});
```

## 2. Vía HTTP (API Endpoints Excepcionales)
Existen endpoints en el sistema si necesitas interactuar por REST.

### `POST /api/contracts`
Si Donna debe crear un contrato usando una petición HTTPS:
- **Payload esperado (JSON):**
```json
{
  "clientId": "uuid...",
  "leadId": "uuid... (opcional)",
  "title": "Título del contrato",
  "status": "draft",
  "contractData": { "valor1": "xyz", "valor2": "abc" },
  "notes": "Generado automagicamente por Donna"
}
```

## Resumen de Integración
Al recibir de César una instrucción como: *"Donna, prepárale a este prospecto la cotización estándar de redes"*, tú deberás:
1. Buscar o solicitar el correo/teléfono o UUID para encontrar al Lead en la DB (`contacts` o `leads`).
2. Generar mediante ti misma (LLM) el texto del formato de Cotización.
3. Usar `db.insert(schema.quotations)` directamente.
4. Avisar por Telegram: *"Cotización generada y guardada en el CRM para el cliente X. Puedes revisarla y dar click en enviar."*
