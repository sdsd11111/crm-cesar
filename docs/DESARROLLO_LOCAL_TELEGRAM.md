# Desarrollo Local de Telegram - Guía Completa

## 🎯 Objetivo

Esta guía te ayudará a desarrollar y depurar el flujo de Telegram de Donna localmente, sin necesidad de desplegar constantemente a Vercel.

## 🧪 Página de Pruebas: `/pruebasteegram`

### Acceso
```
http://localhost:3000/pruebasteegram
```

### Características

#### 1. **Panel de Entrada**
- Campo de texto para simular mensajes de Telegram
- Botones de prueba rápida con casos comunes
- Atajo de teclado: `Ctrl + Enter` para enviar

#### 2. **Panel de Respuesta**
- Muestra la respuesta exacta que Donna daría
- Incluye tiempo de procesamiento
- Formato idéntico al que se enviaría por Telegram

#### 3. **Panel de Logs en Tiempo Real**
- Visualización detallada de cada paso del proceso
- Códigos de color por tipo:
  - 🔵 **Info**: Pasos normales del proceso
  - ✅ **Success**: Operaciones exitosas
  - ⚠️ **Warning**: Advertencias
  - ❌ **Error**: Errores
- Datos JSON expandidos para cada paso

#### 4. **Panel de Google Calendar**
- Muestra eventos de los próximos 7 días
- Actualizado en cada prueba
- Permite comparar con la respuesta de Donna

#### 5. **Panel de Prompts (NUEVO)**
- Visualiza los prompts exactos usados en cada paso
- **Edición en vivo**: Modifica los prompts y prueba cambios
- Toggle "Usar Custom" para activar/desactivar prompts editados
- Tres prompts disponibles:
  - 🧭 **Router Classifier**: Clasifica la intención (crear/borrar/agenda)
  - ➕ **Create Event**: Extrae datos para crear eventos
  - 📅 **Query Agenda**: Extrae fecha para consultar agenda

## 📋 Casos de Prueba Comunes

### Consultar Agenda
```
Revisa mi agenda para el lunes
Qué tengo hoy?
Estoy libre mañana?
```

### Crear Eventos
```
Agenda reunión mañana a las 3pm con Juan
Agendar llamada con cliente el viernes a las 10am
Cita el lunes a las 5 de la tarde
```

### Casos Edge
```
Agendar llamada el viernes (sin hora específica)
Reunión mañana (sin hora ni persona)
```

## 🔍 Interpretando los Logs

### Flujo Normal de Consulta de Agenda

```
1. Inicio
   - Muestra el texto recibido

2. Prompts Cargados
   - Confirma que se cargaron los 3 prompts

3. Procesando con AgendaManager
   - Inicia el proceso principal

4. Resultado de AgendaManager
   - Muestra la respuesta generada

5. Consultando Google Calendar
   - Busca eventos en el rango especificado

6. Eventos de Calendario Obtenidos
   - Lista los eventos encontrados
```

### Flujo Normal de Creación de Evento

```
1. Inicio
2. Prompts Cargados
3. Procesando con AgendaManager
4. [AgendaManager] Clasificando intención
5. [AgendaManager] Intent: "crear"
6. [AgendaManager] Extrayendo datos del evento
7. [AgendaManager] Datos extraídos: { fecha, hora, para, mensaje }
8. Resultado de AgendaManager
9. Consultando Google Calendar
10. Eventos de Calendario Obtenidos
```

## 🛠️ Desarrollo Local con Telegram Real (Opcional)

Si quieres probar con el bot real de Telegram en local:

### 1. Instalar ngrok
```bash
# Descargar de https://ngrok.com/download
# O con chocolatey:
choco install ngrok
```

### 2. Exponer tu servidor local
```bash
# En una terminal separada
ngrok http 3000
```

Esto te dará una URL como: `https://abc123.ngrok.io`

### 3. Configurar webhook de Telegram
```bash
# Reemplaza <BOT_TOKEN> y <NGROK_URL>
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<NGROK_URL>/api/telegram/webhook"
```

### 4. Probar
- Envía un mensaje o audio a tu bot
- Los logs aparecerán en tu consola local
- Las respuestas se enviarán por Telegram

### 5. Desactivar webhook (cuando termines)
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

## 🎨 Afinando Prompts

### Workflow Recomendado

1. **Ejecuta una prueba** para cargar los prompts originales
2. **Ve a la pestaña "Prompts"**
3. **Edita el prompt** que quieres mejorar
4. **Activa "Usar Custom"**
5. **Ejecuta otra prueba** con el mismo texto
6. **Compara resultados** en los logs
7. **Itera** hasta obtener el comportamiento deseado

### Ejemplo: Mejorar Clasificación

Si Donna no está clasificando bien "revisa mi agenda", puedes:

1. Ir al prompt **Router Classifier**
2. Agregar más ejemplos:
```markdown
Ejemplos de "agenda":
- "revisa mi agenda"
- "qué tengo pendiente"
- "estoy libre mañana"
- "tengo algo el lunes"
```
3. Probar de nuevo

### Guardar Cambios

Una vez que tengas un prompt que funciona mejor:

1. Copia el texto del editor
2. Pega en el archivo correspondiente:
   - `lib/donna/prompts/agenda/router_classifier.md`
   - `lib/donna/prompts/agenda/create_event.md`
   - `lib/donna/prompts/agenda/query_agenda.md`
3. Guarda el archivo
4. Los cambios se aplicarán permanentemente

## 🚀 Workflow de Desarrollo Recomendado

### Fase 1: Desarrollo Local (AHORA)
1. Usa `/pruebasteegram` para todas las pruebas
2. Afina prompts hasta que funcionen perfectamente
3. Verifica logs para entender el flujo
4. Compara con Google Calendar

### Fase 2: Testing con Telegram Real (Opcional)
1. Configura ngrok
2. Prueba con mensajes de texto
3. Prueba con audios
4. Verifica que todo funcione igual que en la página de pruebas

### Fase 3: Despliegue a Vercel (Final)
1. Ejecuta `npm run build` para verificar que compile
2. Haz commit de todos los cambios
3. Push a GitHub
4. Vercel desplegará automáticamente
5. Configura el webhook de Telegram a la URL de Vercel

## 📊 Logs en Consola

Además de los logs en la UI, verás logs detallados en la consola del servidor:

```
📅 [AgendaManager] Procesando input: { text: "...", chatId: "..." }
🧭 [AgendaManager] Clasificando intención...
🧭 [AgendaManager] Prompt router preparado
🧭 [AgendaManager] Clasificación completada: agenda
📅 [AgendaManager] Intent clasificado: "agenda"
📅 [AgendaManager] Ejecutando: handleQueryAgenda
```

Estos logs te ayudan a entender exactamente qué está pasando en cada paso.

## 🐛 Troubleshooting

### "No text provided"
- Asegúrate de escribir algo en el campo de texto antes de enviar

### "Error: OpenAI API key not configured"
- Verifica que `OPENAI_API_KEY` esté en tu `.env.local`

### "Error connecting to Google Calendar"
- Verifica que `google_credentials.json` exista en la raíz del proyecto
- Asegúrate de que la cuenta de servicio tenga acceso al calendario

### Los prompts no se cargan
- Ejecuta una prueba primero
- Los prompts se cargan después de la primera ejecución

### Cambios en prompts no se aplican
- Asegúrate de activar el toggle "Usar Custom"
- Verifica que el texto del prompt sea válido

## 💡 Tips

1. **Usa Ctrl+Enter** para enviar rápidamente
2. **Compara logs** entre diferentes pruebas para ver qué cambió
3. **Guarda prompts exitosos** inmediatamente en los archivos .md
4. **Prueba casos edge** para asegurar robustez
5. **Verifica Google Calendar** después de crear eventos

## 🎯 Próximos Pasos

Una vez que el sistema funcione perfectamente en local:

1. ✅ Hacer `npm run build` para verificar
2. ✅ Commit y push a GitHub
3. ✅ Desplegar a Vercel
4. ✅ Configurar webhook de Telegram a producción
5. ✅ Probar con usuarios reales

---

**¡Feliz debugging! 🚀**
