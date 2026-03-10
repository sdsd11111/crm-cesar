# Manual Técnico - Módulo Cotizaciones

## 📋 Visión General
**Propósito**: Generación y gestión de propuestas comerciales con IA.

## 🎯 Funcionalidades Principales

### 1. **Generación con IA**
- **Gemini Integration**: Genera descripciones de servicios automáticamente
- **Personalización**: Adapta propuesta según perfil del cliente
- **Templates**: Plantillas predefinidas por tipo de servicio

### 2. **Selector de Productos**
- **MultiProductSelector**: Selección múltiple de servicios
- **Categorías**: Filtrado por tipo de producto
- **Precios**: Cálculo automático de totales

### 3. **Gestión de Estados**
- `draft`: Borrador en edición
- `sent`: Enviada al cliente
- `approved`: Aprobada por cliente
- `rejected`: Rechazada
- `expired`: Vencida

### 4. **Generación de PDF**
- Diseño profesional
- Logo y branding
- Términos y condiciones
- Tabla de productos/servicios
- Totales y descuentos

## 📊 Estructura de Datos

```typescript
interface Quotation {
  id: string;
  clientId: string;
  leadId?: string;
  products: string[];  // IDs de productos
  description: string; // Generado por IA
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: Date;
  status: QuotationStatus;
  notes: string;
  createdAt: Date;
}
```

## 🔄 Flujo de Trabajo

```
1. Seleccionar cliente/lead
2. Elegir productos/servicios
3. Generar descripción con IA
4. Revisar y ajustar precios
5. Generar PDF
6. Enviar al cliente
7. Seguimiento de respuesta
8. Aprobar → Crear Contrato
   o Rechazar → Archivar
```

## 🤖 Generación con IA

**Endpoint**: `POST /api/quotations/generate-description`

**Proceso**:
1. Usuario selecciona productos
2. IA analiza productos + perfil del cliente
3. Genera descripción personalizada
4. Usuario puede editar antes de enviar

**Ejemplo de Prompt**:
```
Cliente: Hotel Boutique en Loja
Productos: Marketing Digital, Diseño Web
Genera una descripción profesional de la propuesta...
```

## 🔌 Integración

### Con **Clients/Leads**
- Cotizaciones para clientes existentes o leads calificados
- Datos del cliente pre-llenan formulario

### Con **Products**
- Catálogo de productos/servicios
- Precios y descripciones

### Con **Contratos**
- Cotización aprobada → Crear contrato
- Productos pasan automáticamente

### Con **Finanzas**
- Cotización aprobada puede generar factura proforma

## 🎨 Características del PDF

- **Header**: Logo + datos de empresa
- **Cliente**: Nombre, contacto, dirección
- **Tabla de Productos**:
  - Descripción
  - Cantidad
  - Precio unitario
  - Subtotal
- **Totales**: Subtotal, descuento, IVA, total
- **Términos**: Validez, forma de pago, garantías
- **Footer**: Datos de contacto, firma

## 🚨 Limitaciones Actuales

1. **Sin Versionado**: No guarda versiones anteriores
2. **Sin Firma Digital**: Cliente debe firmar físicamente
3. **Sin Envío Automático**: Email manual
4. **Sin Seguimiento**: No registra si cliente abrió PDF

## 🔮 Mejoras Sugeridas

### Corto Plazo
1. **Envío por Email**: Integración con servicio de email
2. **Tracking**: Saber si cliente abrió cotización
3. **Recordatorios**: Alertas de seguimiento

### Mediano Plazo
4. **Versionado**: Historial de cambios
5. **Comparación**: Comparar versiones
6. **Aprobación Online**: Cliente aprueba desde link

### Largo Plazo
7. **Firma Digital**: DocuSign integration
8. **Pago Online**: Link de pago en cotización
9. **Analytics**: Tasa de conversión por producto

---
**Versión**: 1.0 | **Última actualización**: Diciembre 2025
