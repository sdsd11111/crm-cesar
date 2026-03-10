# Manual Técnico - Módulo Events (Eventos y Calendario)

## 📋 Visión General
**Propósito**: Gestión de calendario y eventos del equipo de ventas.

## 🎯 Funcionalidades
- **Calendario Visual**: Vista mensual/semanal/diaria
- **Crear Eventos**: Reuniones, llamadas, demos
- **Invitados**: Múltiples participantes
- **Recordatorios**: Notificaciones antes del evento
- **Tipos**: Reunión, llamada, demo, capacitación, otro
- **Sincronización**: Google Calendar (potencial)

## 📊 Estructura de Datos

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'meeting' | 'call' | 'demo' | 'training' | 'other';
  location?: string;
  attendees: string[];  // User IDs
  relatedTo?: {
    type: 'lead' | 'client' | 'deal';
    id: string;
  };
  reminderMinutes: number;  // 15, 30, 60, etc.
  status: 'scheduled' | 'completed' | 'cancelled';
}
```

## 🔄 Flujo de Trabajo

```
1. Crear evento desde:
   - Calendario directamente
   - Lead (agendar llamada)
   - Task (convertir a evento)
2. Definir fecha, hora, duración
3. Añadir participantes
4. Configurar recordatorio
5. Guardar
6. Recibir notificación antes del evento
7. Marcar como completado
```

## 🔌 Integración

### Con **Leads**
- Botón "Agendar Llamada" en lead
- Crea evento automáticamente

### Con **Tasks**
- Tareas con fecha → Aparecen en calendario
- Convertir tarea a evento

### Con **Google Calendar**
- Sincronización bidireccional
- Webhook para notificaciones
- OAuth integration

### Con **Dashboard**
- Widget "Próximos Eventos"
- Alertas de eventos del día

## 🎨 Vistas

### 1. **Mensual**
- Vista general del mes
- Eventos como dots o mini-cards

### 2. **Semanal**
- 7 días en columnas
- Bloques de tiempo por hora

### 3. **Diaria**
- Timeline detallado
- Agenda del día

### 4. **Lista**
- Todos los eventos en lista
- Filtros y búsqueda

## 📅 Tipos de Eventos

- **Reunión**: Presencial o virtual
- **Llamada**: Telefónica o videollamada
- **Demo**: Demostración de producto
- **Capacitación**: Training interno
- **Otro**: Eventos generales

## 🔮 Mejoras Sugeridas
- Videollamada integrada (Zoom/Meet)
- Grabación de llamadas
- Notas de reunión
- Actas automáticas con IA
- Disponibilidad compartida
- Booking links (Calendly-style)

---
**Versión**: 1.0 | **Última actualización**: Diciembre 2025
