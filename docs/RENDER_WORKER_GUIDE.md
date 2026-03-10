# 🚀 Arquitectura del Worker de Mensajes Asíncronos en Render

Este documento detalla la configuración y arquitectura del sistema de colas (Worker) utilizado en Objetivo CRM. Fue diseñado para soportar alta concurrencia, evitar respuestas duplicadas, resolver problemas crónicos de alojamiento en Render, y simular el comportamiento humano de "escucha" (ventana de acumulación).

---

## 1. ¿Cómo dispara Render el proceso de la cola?
**No usamos Cron Jobs de Render ni Pings externos (UptimeRobot) para procesar la cola.**

El sistema corre como un **proceso "Always-On"** (un script continuo).
- Se dispara una sola vez cuando el servidor arranca (`npm run worker:messages`).
- Usa un bucle infinito seguro basado en **recursividad asíncrona** (`setTimeout` al final de la función).
- Al finalizar de procesar (o no encontrar nada), el script hace un `setTimeout(processQueue, 5000)`. Así, la cola se revisa sola **cada 5 segundos**, pero estrictamente *después* de haber terminado de procesar el lote anterior. Esto es fundamental para evitar saturar el sistema de hilos.

## 2. ¿Cuál es la configuración exacta en Render para evitar que se duerma?
Este fue uno de los mayores dolores de cabeza y se resolvió con un **"Health Check Hack"**.

En Render, los servicios web (Web Services) se duermen si no reciben tráfico web (HTTP). Si configuras el script como un Background Worker, a veces falla el despliegue porque Render exige que el puerto se abra dentro de los primeros 60 segundos (Error de Bind Port).

**La solución implementada:**
Al inicio exacto del archivo `message_worker.ts`, levantamos un servidor HTTP diminuto y falso:

```typescript
import http from 'http';
const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Worker Active');
});
server.listen(port, '0.0.0.0', () => {
    console.log(`🌍 Health Check Server running on port ${port}`);
});
```
De esta manera, Render detecta salud inmediata, el servicio levanta en verde siempre, y podemos usar un plan de "Web Service" (mantenido despierto por un ping externo si estamos en plan gratis, o Always-On si estamos en plan pago) sin que el servidor muera.

## 3. ¿Cómo evitan la "Respuesta Duplicada"? (Control de Concurrencia)
Evitamos bloqueos complejos (como Redis) utilizando una combinación de lógica en SQL y Node.js:

1. **Evitar solapamiento de ciclos:** Como usamos `setTimeout` al *final* del `try/finally` del bloque `processQueue`, es **imposible** que un ciclo de procesamiento comience si el anterior no ha terminado. Si el ciclo tarda 40 segundos, el próximo comenzará en el segundo 45.
2. **Lectura por ID y Limpieza Atómica:** 
    - El worker busca todos los mensajes del cliente X.
    - Se guardan en una constante en memoria (`messageIds`).
    - Pasa los mensajes a la IA.
    - Cuando la IA responde con éxito, el worker hace un `DELETE FROM pending_messages_queue WHERE id IN (arreglo_de_ids)`.
    - Si llega un mensaje nuevo de ese cliente *mientras* la IA pensaba, ese mensaje nuevo tendrá un ID diferente, no será borrado, y se procesará en el siguiente ciclo.

## 4. ¿Cuál fue el "Problema Crítico" del proyecto anterior?
El proyecto antiguo fallaba por tres motivos principales que este nuevo Worker soluciona de raíz:

- **Efecto "Metralleta" (Caos de Contexto):** Si un cliente escribía *"Hola"*, *"precio"*, *"info"*, *"gracias"* (4 mensajes rápidos en WhatsApp), el antiguo sistema basado en Webhooks disparaba 4 peticiones simultáneas a OpenAI. La IA se volvía loca respondiendo a cada pedazo sin contexto.
  **Solución:** El Webhook ahora *solo inserta* a la base de datos de cola. Nunca procesa texto. El Worker lo acumula todo.
- **Port Bind Timeout en Render:** Render mataba el worker antes de iniciar porque no abría ningún puerto HTTP.
  **Solución:** El mini servidor HTTP falso mencionado en el punto 2.
- **Respuestas Duplicadas:** Por latencia de red, a veces Meta WhatsApp re-enviaba el webhook (creyendo que falló).
  **Solución:** El id del mensaje de Meta sirve hoy como Unique Hash preventivo en la tabla, pero además, el worker vacía la cola atómicamente por lote, no por mensaje.

## 5. ¿Qué tiempo de respuesta es el ideal?
Implementamos dos tiempos complementarios:

1. **`POLL_INTERVAL_MS = 5000` (5 Segundos - El Ping interno)**:
   Cada 5 segundos el worker mira la base de datos "por si acaso" hay algo que hacer. Es lo suficientemente rápido para sentirse en tiempo real, pero consume bajísimos recursos de base de datos.
2. **`ACCUMULATION_WINDOW_MS = 25000` (25 Segundos - La ventana humana)**:
   Cuando el worker pilla un mensaje nuevo, mira la hora: `hora_actual - hora_del_primer_mensaje`. Si no han pasado 25 segundos, lo ignora y le envía un evento de *"Escribiendo..."* a WhatsApp para que el cliente no se desespere. 
   
   **¿Por qué 25 segundos?**
   Es el tiempo estadísticamente perfecto para que un cliente humano termine de tipear su idea fragmentada ("Hola" ... [10s] ... "Quiero info" ... [5s] ... "para 2 personas"). Si respondes en 5 segundos, interrumpes al cliente. 25 segundos garantiza que el bloque de texto sea masivo y el gasto de Tokens en IA sea de un solo golpe.
