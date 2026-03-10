# Manual Técnico - Módulo Prospects

## 📋 Visión General
**Propósito**: Gestión masiva de contactos de prospección con integración WhatsApp.

## ⚠️ NOTA IMPORTANTE
Este módulo tiene **funcionalidad redundante con Discovery**. Ver `analysis_prospects_vs_discovery.md` para análisis completo y recomendación de consolidación.

## 🎯 Funcionalidades

### 1. **Gestión de Prospectos**
- Tabla con paginación (25/50/100 registros)
- Búsqueda por nombre
- CRUD completo
- Estados de outreach

### 2. **Integración WhatsApp**
- **Exportar**: Genera JSON para WhatsApp App
- **Importar**: Actualiza estados desde WhatsApp App
- **Envío Directo**: Botón para abrir WhatsApp Web

### 3. **Estados de Contacto**
- `new`: Sin contactar
- `contacted`: Contactado
- `responded`: Respondió
- `interested`: Interesado
- `not_interested`: No interesado

## 📊 Estructura de Datos

```typescript
interface Prospect {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  businessType: string;
  outreachStatus: string;
  whatsappStatus: 'sent' | 'failed' | 'pending';
  whatsappSentAt: Date;
  notes: string;
}
```

## 🔄 Flujo con WhatsApp

```
1. Exportar prospectos a JSON
2. Importar JSON en WhatsApp App
3. Trabajar contactos en WhatsApp App
4. Actualizar estados
5. Exportar JSON desde WhatsApp App
6. Importar en Prospects
7. Estados se sincronizan
```

## 🔌 APIs

- `GET /api/prospects` - Listar con paginación
- `POST /api/prospects` - Crear prospecto
- `GET /api/prospects/export-whatsapp` - Exportar JSON
- `POST /api/prospects/import-whatsapp` - Importar estados

## 🆚 Prospects vs Discovery

| Característica | Prospects | Discovery |
|----------------|-----------|-----------|
| Propósito | Gestión masiva + WhatsApp | Prospección + IA |
| Filtros | Búsqueda simple | 11 filtros avanzados |
| IA | ❌ | ✅ Gemini |
| WhatsApp | ✅ Integración completa | ❌ |
| Cola | ❌ | ✅ |
| Tagging | ❌ | ✅ (columna1/2) |

## 💡 Recomendación

**Consolidar con Discovery**:
- Migrar datos de Prospects → Discovery
- Añadir funcionalidad WhatsApp a Discovery
- Eliminar módulo Prospects
- Tiempo estimado: 3-4 horas

Ver: `analysis_prospects_vs_discovery.md`

---
**Versión**: 1.0 | **Última actualización**: Diciembre 2025
