# Estados, Flujos y Ciclos de Vida

Para mantener la integridad del CRM (Kanban, Reportes y Filtros), Donna debe entender el ciclo de vida de cada tipo de entidad y aplicar las transiciones correctas al generar documentos.

## 1. El Contacto / Lead / Cliente (Las Personas)
* `contacts.entityType`: Solo evoluciona unidireccionalmente.
   `'prospect'` => `'lead'` => `'client'`
* `contacts.status` / `leads.status`: Muestra la fase de calentamiento comercial de un Contacto tipo Lead.
  * Valores: `'sin_contacto'`, `'primer_contacto'`, `'segundo_contacto'`, `'tercer_contacto'`, `'cotizado'`, `'convertido'`.

**Acción de Donna:**
Cuando Donna genere la primera Cotización para un Lead, debe actualizar automáticamente el estado del Lead a `cotizado`:
```typescript
await db.update(schema.leads)
  .set({ status: 'cotizado' })
  .where(eq(schema.leads.id, leadId));
// (También aplica en schema.contacts)
```
Cuando un Lead firme el contrato y Donna sea notificada (o generes el registro final pagado), pasará a `convertido` (O `entityType: 'client'`).

## 2. La Cotización (`quotations`)
Posee el flujo:
* `'draft'`: Creado inicialmente por Donna y en etapa "borrador" internamente.
* `'sent'`: El CRM registra que fue despachado al correo o Wapp del cliente.
* `'approved'`: El cliente dijo sí (puede desencadenar el pipeline comercial de cierre).
* `'rejected'`: Cliente no aceptó. Obliga a un rescate futuro.

**Manejo Default:** Cualquier cotización que Donna inserte a petición de César/Abel mientras manejan debiera ir inicialmente como `'draft'` (O `'sent'` si te ordenan enviarla en el mismo paso).

## 3. El Contrato (`contracts`)
Sigue el flujo legal del sistema:
* `'draft'`: Recién generado y preparado.
* `'pending_signature'`: El PDF fue emitido y despachado. Se espera que el representante legal firme.
* `'signed'`: Totalmente activado y el equipo operativo ya puede trabajar.
* `'void'`: Anulado.

**Generación Inteligente:** Si te piden hacer un contrato, su estado será siempre `'draft'` a menos que César te diga "generado y envíaselo a firma", en cuyo caso al emitirlo por email o Wapp cambiarías a `'pending_signature'`.

## Conclusión
1. Cotizar a un Lead => **Subir de estado el Lead a 'cotizado'**.
2. Documento creado autónomamente => Usar siempre estado `'draft'`.
3. Contrato firmado => **Subir Lead a Cliente ('client')**.
