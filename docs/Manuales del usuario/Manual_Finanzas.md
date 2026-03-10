# 💰 Manual del Módulo Financiero (Cash Flow)

## 1. Guía de Uso Rápido

Este módulo está diseñado para que **nunca olvides cobrar ni pagar**, y para que sepas exactamente cuánto dinero real tienes.

### A. ¿Qué veo en el Dashboard?
Al entrar a **Finanzas** desde el menú lateral, verás 4 tarjetas clave:
1.  **Flujo de Caja (Mes):** Dinero que ha *entrado* menos dinero que ha *salido* **este mes**. (Solo transacciones PAGADAS).
2.  **Por Cobrar (Alerta Amarilla):** Dinero que ya facturaste o acordaste pero **aún no recibes**.
3.  **Por Pagar (Alerta Roja):** Gastos o facturas que tienes pendientes de pago.
4.  **Balance Total:** Tu liquidez histórica total (Todo lo que has ganado - todo lo que has gastado desde el inicio).

### B. Registrar un Movimiento
1.  Haz clic en el botón negro **`+ Nueva Transacción`** arriba a la derecha.
2.  **Tipo:** Elige "Ingreso" (si entra dinero) o "Gasto" (si sale dinero).
3.  **Estado:**
    *   `Pendiente`: Si es una cuenta por cobrar/pagar a futuro.
    *   `Pagado`: Si el dinero ya se movió hoy.
4.  **Fecha:** Importante para los recordatorios.
5.  **Guardar.**

### C. Alertas
*   En la pestaña "Resumen", verás una lista de **"Alertas de Vencimiento"**.
*   Si una cuenta por cobrar/pagar llega a su fecha, aparecerá allí.
*   🔴 **Rojo:** Vencido (La fecha ya pasó).
*   🟡 **Ámbar:** Pendiente (Aún estás a tiempo).

---

## 2. ¿Cómo se construyó? (Resumen Técnico)

Para entender cómo funciona "bajo el capó", aquí está la arquitectura simplificada que implementamos:

### 1. Base de Datos (SQLite + Drizzle)
Creamos una sola tabla maestra llamada `transactions`. En lugar de tener contabilidad compleja (libro diario, mayor, etc.), usamos una tabla que guarda todo::
*   `type`: INCOME o EXPENSE.
*   `status`: PENDING, PAID, OVERDUE.
*   `date` y `dueDate`: Para manejar los tiempos.

### 2. Backend (API Routes)
Usamos **Next.js API Routes** para la lógica:
*   `POST /api/finance/transactions`: Recibe los datos, los valida con **Zod** (para asegurar que no metas texto en el campo de precio) y los guarda.
*   `GET /api/finance/metrics`: Hace cálculos matemáticos directos en la base de datos (SQL Aggregations) para sumar montos recibidos, gastados y pendientes en tiempo real. Es muy rápido.

### 3. Frontend (React + Shadcn UI)
*   **Componentes:** Reutilizamos los componentes de diseño (Cards, Badges, Buttons) para mantener la estética "Premium".
*   **Estado:** La página busca los datos automáticamente al cargar y cada vez que creas una transacción, manteniéndose siempre sincronizada.
*   **UX:** Diseñado para minimizar clics. Formulario modal para no perder el contexto del dashboard.

### 4. Por qué esta arquitectura?
Elegimos **"Cash Flow Operativo"** sobre "Contabilidad Formal" para priorizar la velocidad. Un sistema contable requiere asientos dobles y es lento. Este sistema te dice "cuánto tienes" y "qué debes" al instante.

---

## 3. Integración con Cortex AI y Contactos

**IMPORTANTE PARA EL AGENTE DE IA (CORTEX):**

Para garantizar que la IA pueda "ver" la información financiera vinculada a cada cliente, hemos unificado la estructura de datos:

*   **Tabla Maestra de Personas:** `contacts` (Esta tabla unificada contiene IDs de Prospectos, Leads y Clientes).
*   **Vinculación Financiera:** La tabla `transactions` utiliza la columna **`contact_id`** como *Foreign Key* para relacionarse con `contacts.id`.
*   **Campo Obsoleto:** La columna antigua `client_id` se mantiene por compatibilidad histórica pero **ya no debe usarse** para nuevas relaciones.
*   **Instrucción de Búsqueda:** Cuando Cortex necesite responder "¿Cuánto ha pagado el cliente X?", debe realizar un JOIN (o consulta relacionada) entre `transactions.contact_id` y `contacts.id`, filtrando por `transactions.status = 'PAID'`.
