# Manual Técnico - Módulo Settings (Configuración)

## 📋 Visión General
**Propósito**: Configuración del sistema y preferencias de usuario.

## 🎯 Secciones

### 1. **Perfil de Usuario**
- Nombre y datos personales
- Email y teléfono
- Foto de perfil
- Cambio de contraseña

### 2. **Preferencias**
- Idioma (Español/Inglés)
- Zona horaria
- Formato de fecha
- Moneda predeterminada

### 3. **Notificaciones**
- Email notifications
- Push notifications
- Frecuencia de resúmenes
- Tipos de alertas

### 4. **Integraciones**
- **Google Calendar**: OAuth y sincronización
- **WhatsApp Business**: API key
- **Gemini AI**: API key y configuración
- **Email**: SMTP settings

### 5. **Equipo** (Admin)
- Gestión de usuarios
- Roles y permisos
- Invitar miembros
- Desactivar usuarios

### 6. **Empresa**
- Datos de la empresa
- Logo y branding
- Información fiscal
- Términos y condiciones

### 7. **Productos/Servicios**
- Catálogo de productos
- Precios
- Categorías
- Descripciones

### 8. **Plantillas**
- Templates de cotizaciones
- Templates de contratos
- Templates de emails
- Mensajes de WhatsApp

## 🔐 Roles y Permisos

### Roles Disponibles
- **Admin**: Acceso total
- **Manager**: Gestión de equipo y reportes
- **Sales**: Leads, clientes, cotizaciones
- **Viewer**: Solo lectura

### Permisos Granulares
- Ver/Editar leads
- Crear cotizaciones
- Aprobar contratos
- Acceso a finanzas
- Gestionar usuarios
- Configurar integraciones

## 🔌 Integraciones

### Google Calendar
```
1. Ir a Settings > Integraciones
2. Clic "Conectar Google Calendar"
3. OAuth flow
4. Seleccionar calendario
5. Configurar sincronización
```

### Gemini AI
```
1. Obtener API key de Google AI Studio
2. Settings > Integraciones > Gemini
3. Pegar API key
4. Probar conexión
5. Configurar límites de uso
```

### WhatsApp Business
```
1. Crear cuenta en WhatsApp Business API
2. Obtener credenciales
3. Settings > Integraciones > WhatsApp
4. Configurar webhook
5. Verificar número
```

## 🎨 Personalización

### Branding
- Logo de empresa (header, PDFs)
- Colores primarios y secundarios
- Tipografía
- Footer de emails

### Templates
- Cotizaciones: Diseño y estructura
- Contratos: Cláusulas estándar
- Emails: Firma y formato

## 🔮 Mejoras Sugeridas

### Corto Plazo
1. **Backup Automático**: Exportar datos
2. **Audit Log**: Registro de cambios
3. **API Keys**: Para integraciones custom

### Mediano Plazo
4. **SSO**: Single Sign-On
5. **2FA**: Autenticación de dos factores
6. **Webhooks**: Notificaciones a sistemas externos

### Largo Plazo
7. **Multi-tenant**: Múltiples empresas
8. **White Label**: Personalización total
9. **Marketplace**: Integraciones de terceros

---
**Versión**: 1.0 | **Última actualización**: Diciembre 2025
