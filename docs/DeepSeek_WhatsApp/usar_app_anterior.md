# 🔄 Configuración con la App Anterior

## 📋 Pasos para Usar la App Anterior

### Paso 1: Obtener Credenciales de la App Anterior

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu **app anterior** (la que ya tenías configurada)
3. Ve a **WhatsApp > API Setup**
4. Anota:
   - **Phone Number ID** (el ID del número de prueba o real)
   - **Genera un nuevo token temporal** (o usa el permanente si lo tienes)

### Paso 2: Actualizar `.env.local`

Reemplaza las credenciales en tu `.env.local`:

```env
# Meta WhatsApp API (App Anterior)
META_WA_ACCESS_TOKEN=<TOKEN_PERMANENTE>
META_WA_PHONE_NUMBER_ID=986410541212156
META_WA_VERIFY_TOKEN=objetivo_crm_secret
```

### Paso 3: Configurar Webhook en la App Anterior

1. En la app anterior, ve a **WhatsApp > Configuración**
2. Busca la sección **"Webhooks"** o **"Suscribirte a webhooks"**
3. Configura:
   - **URL de devolución de llamada**: `https://crm-z2kv.vercel.app/api/webhooks/whatsapp`
   - **Token de verificación**: `objetivo_crm_secret`
4. Haz clic en **"Verificar y guardar"**
5. Suscríbete a los eventos `messages`

### Paso 4: Subir Cambios a Git y Vercel

Necesitamos que Vercel tenga el código actualizado con DeepSeek:

```bash
# 1. Ver estado actual
git status

# 2. Agregar todos los cambios
git add .

# 3. Hacer commit
git commit -m "feat: Integración DeepSeek R1 y actualización WhatsApp Meta"

# 4. Subir a GitHub
git push origin main
```

Vercel detectará automáticamente el push y desplegará la nueva versión.

### Paso 5: Probar

Una vez que Vercel termine de desplegar:

```bash
npx tsx scripts/test_whatsapp.ts 0963410409
```

---

## 🗑️ ¿Borrar la App Nueva?

**Sí, puedes borrarla** si no la vas a usar. Para borrarla:

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona la app nueva que creaste
3. Ve a **Configuración > Básica** (Settings > Basic)
4. Baja hasta el final de la página
5. Haz clic en **"Eliminar app"** (Delete App)

---

## 🎯 Ventaja de Usar la App Anterior

- ✅ Ya está configurada y probada
- ✅ Puede que ya tenga el webhook funcionando
- ✅ Evitas problemas de configuración inicial
- ✅ Menos pasos para poner todo a funcionar

---

## ⚠️ Importante

Después de subir los cambios a Git, **espera 1-2 minutos** para que Vercel termine de desplegar antes de probar el webhook.
