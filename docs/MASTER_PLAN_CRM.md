# 📘 RADIOGRAFÍA MAESTRA: CRM OBJETIVO V2

> **Documento Vivo**: Este archivo centraliza toda la información del proyecto. Aquí definimos qué tenemos, qué falta y hacia dónde vamos.

---

## 1. VISIÓN GENERAL
**Objetivo**: Transformar el CRM de una herramienta de registro manual a una **Máquina de Prospección y Ventas Semiautomática**.
**Filosofía**: "Tecnología al servicio del humano". Automatizamos lo repetitivo (preparar mensajes, organizar listas) para que tú (César) te enfoques en lo valioso (crear contenido y cerrar ventas).

---

## 2. ESTADO ACTUAL (LO QUE YA TENEMOS)

### 🏗️ Arquitectura Técnica
- **Frontend**: Next.js 15 (Rápido y moderno).
- **Base de Datos**: Supabase (PostgreSQL) - Robusta y escalable.
- **Estilo**: Glassmorphism (Verde oscuro, elegante, premium).

### ✅ Módulos Terminados
1.  **Recorridos (ACC)**: Captura de datos en campo y transcripción IA.
2.  **Constructor de Cotizaciones**: Creación de propuestas PDF con plantillas.
3.  **Sistema de Inteligencia Estratégica**:
    - **Tablero FODA Visual**: Matriz estratégica en la ficha del cliente.
    - **Cortex 360**: Generador de informes de inteligencia IA con streaming.
    - **Dashboard Analítico**: Segmentación de cartera por industria.
4.  **Gestión de Leads**: Tabla y conversión automática a clientes.
5.  **Motor de Búsqueda y Filtrado Avanzado (Discovery)**:
    - **Faceted Search**: Búsqueda por facetas que actualiza dinámicamente las opciones de Provincia, Cantón, Actividad y Categoría basándose en la selección actual.
    - **Validación en Tiempo Real**: Eliminación de opciones sin resultados ("Dead Ends") para mejorar la UX.
    - **Corrección de Datos**: Mapeo exacto con la base de datos para provincias conflictivas (ej. Sucumbíos).

---

## 3. EL NUEVO PLAN:
3.  **AUTOMATIZACIÓN Y WORKFLOWS (n8n)**: Conexión con ecosistema n8n.
4.  **DESPLIEGUE LOCAL PRO**: Optimización para uso en PC personal con `npm start`.
5.  **ARQUITECTURA DE ESCALA (BAZOOKA)**: Lazy loading y búsqueda on-demand para manejar miles de registros.

---

## 4. ARQUITECTURA "BAZOOKA" (ESCALABILIDAD)
Para que el CRM sea profesional (SaaS-ready), hemos implementado:
- **Lazy Loading**: Los componentes pesados (como el Chat IA) solo se cargan cuando se usan.
- **Búsqueda On-Demand**: Ya no se descargan todos los clientes; el sistema busca en tiempo real en la base de datos.
- **Virtualización de Datos**: Listas infinitas y paginación para fluidez total.
### 🎯 Objetivo Próximo
Conectar el CRM con el ecosistema de automatización **n8n** para disparar flujos de trabajo (envío de contratos, seguimiento automático, alertas de pagos).

---

## 5. HOJA DE RUTA (ORDEN DE TRABAJO)

### 🟢 FASE 1: Cimientos y Organización (COMPLETO)
1.  [x] Crear Documento Maestro.
2.  [x] **IA Estratégica**: Implementar Cortex 360 y Tablero Visual.
3.  [x] **Dashboard**: Gráficos de segmentación.
4.  [x] **Discovery Avanzado**: Implementación de filtros dinámicos y corrección de inconsistencias de datos.

### 🟡 FASE 2: Conectividad y Automatización (ESTAMOS AQUÍ)
4.  [ ] **Webhooks**: Preparar salidas de datos para n8n.
5.  [ ] **Integración n8n**: Crear el primer flujo de "Nuevo Lead -> Alerta n8n".
6.  [ ] **Firma Electrónica**: Automatizar envío de contratos desde el CRM a n8n.

### 🔴 FASE 3: Dashboard y Métricas
6.  [ ] **Pantalla de Métricas**: Ver gráficamente si la estrategia funciona (Conversión %).

---

## 5. DICCIONARIO DE ESTADOS (PARA HABLAR EL MISMO IDIOMA)
- **Nuevo**: Acabado de importar. Nadie lo ha tocado.
- **En Cola**: Listo para ser contactado hoy.
- **Contactado (WhatsApp)**: Ya le enviaste el video. Esperando respuesta.
- **Contactado (Email)**: Ya recibió al menos un correo.
- **Respondió**: Hubo interacción humana. ¡Oportunidad!
- **Interesado/Llamada**: Agendó cita.
- **Cliente**: Pagó.
- **Newsletter**: Se suscribió a tu lista general (No molestar con venta directa agresiva).

---

## 6. ESCALABILIDAD: EL "CLON" PARA HOTELES (ORO PURO)
El sistema está diseñado para ser replicado y vendido como un SaaS especializado para sectores específicos, siendo el hotelero el primer objetivo.

*   **El Valor del Feedback:** Para un hotel, el "Buzón de Sugerencias" (Iteraciones) es oro puro. Los turistas dan feedback constante sobre su estancia.
*   **Captura de Keywords:** Donna aprende qué es lo que más valoran los turistas (vistas, limpieza, atención) y ajusta los mensajes de seguimiento para fidelizarlos.
*   **Independencia de OTAs:** El objetivo es que el hotel sea dueño de su cliente, moviéndolo de Booking/Expedia a su propio CRM + Sistema de Reservas.

