# Manual de Usuario: Donna v1.2 (Sistema de Confiabilidad)

Donna no es solo una IA, es tu **Oficial de Cumplimiento**. Su objetivo es asegurar que cada promesa hecha a un cliente se convierta en una realidad, protegiendo tu reputación y la confianza del cliente.

## 🚀 1. Antes de la Reunión: El Briefing Estratégico
Cuando tienes una reunión programada, Donna analiza todo el historial del cliente y te prepara una tarjeta de estrategia.

*   **Dónde encontrarlo:** En la pestaña **Estrategia** del detalle del cliente.
*   **Qué incluye:**
    *   **Resumen:** Contexto clave de quién es el cliente y qué busca.
    *   **Estrategia:** El enfoque psicológico o comercial recomendado.
    *   **Puntos a Tocar:** Lista de verificación de temas que no puedes olvidar.
    *   **Scripts:** Cómo responder a las objeciones más probables.
    *   **Rompehielos:** Datos curiosos o recientes para conectar humanamente.

## 🧠 Filosofía de Donna: Macro y Micro
Donna opera en dos niveles para garantizar que ningún detalle se pierda:
- **Donna Macro (Cerebro Central):** Gestiona la estrategia global, reglas de seguridad de WhatsApp (Anti-Ban) y la orquestación de mensajes. Es quien decide "cuándo" es seguro enviar.
- **Donna Micro (Agente Sombra):** Cada cliente tiene su propio agente. Este agente "vive" con el cliente, conoce su historial y sugiere misiones personalizadas basadas en eventos clave (ej: cumpleaños, aniversarios).

---

## 🕰️ Resiliencia de Memoria y Línea de Tiempo
Donna no tiene "memoria de pez". Ante contradicciones (ej: un cliente que dice "no" y luego "sí"), Donna:
1. Analiza las últimas **10 interacciones**.
2. Da prioridad a los eventos más recientes.
3. Si detecta un riesgo alto, genera una **Alerta Interna en Telegram** en lugar de enviar un WhatsApp automático.

---

## 🛡️ Envío Blindado (WhatsApp Hardening)
Para proteger tu número de bloqueos, Donna sigue reglas estrictas:
- **Ventana Humana:** Envíos de Lunes a Sábado, 9:00 AM - 6:00 PM.
- **Límite de Velocidad:** Máximo 50 mensajes diarios automáticos.
- **Delay Humano:** Espera aleatoria de 1 a 3 minutos entre mensajes.
- **Opt-Out:** Si el contacto dice "Basta" o similar, Donna activa el `whatsapp_opt_out` y bloquea envíos.

---

## ✍️ 2. El "Human Protocol" (Notas de Reunión)
Donna extrae compromisos de tus notas, por lo que la calidad de tus notas es vital.
**Consejo Senior:** Usa frases directas como *"El cliente enviará el logo el martes"* o *"Abel creará la propuesta"*.

## ✅ 3. Después de la Reunión: Validación de Compromisos
Este es el paso más crítico del sistema. Donna **nunca** creará un compromiso oficial sin tu aprobación.

1.  **Registra la reunión:** En el botón **Interactuar**, selecciona tipo **Reunión** y escribe tus notas.
2.  **Validación Automática:** Al guardar, se abrirá el modal de **Revisión de Acuerdos de Donna**.
3.  **Acciones en el Modal:**
    *   **Corregir:** Puedes editar el título del compromiso.
    *   **Asignar:** Define quién es el responsable (Cliente, Equipo o Tú).
    *   **Fecha Límite:** Ajusta la fecha real de la promesa.
    *   **Impacto:** Define la severidad (Bajo/Medio/Alto).
4.  **Confirmar y Activar:** Una vez que das "OK", los compromisos pasan de *Draft* a **Active** en la base de datos oficial.

## 🔔 4. El Vigía: Recordatorios Proactivos (WhatsApp)
Donna ya no solo vive en tu pantalla; te busca para que nada se pierda.

*   **Para César y Abel (Interno):** Donna enviará mensajes Push vía WhatsApp cuando un compromiso esté cerca de vencer: *"Oye César, tienes pendiente X con Y para hoy"*.
*   **Para el Cliente (Externo):** Si el cliente te debe algo (ej. el logo), Donna puede enviar un recordatorio amable por WhatsApp.
    *   **Protocolo de Seguridad (Gatillo Único):** Para evitar baneos y duplicados, Donna ahora separa la **Aprobación** del **Envío**:
        1. **Planificación:** Tus agentes proponen mensajes (cumpleaños, deudas, etc.).
        2. **Aprobación:** Tú das el visto bueno en el módulo de Donna. La misión pasa a estado `Aprobado`.
        3. **Despacho Centralizado:** El "Gatillo Único" de Donna revisa las misiones aprobadas y las envía **solo en horario laboral (9AM-7PM)** y con ráfagas controladas (máx 20/hora).
        4. **Auditoría:** Cada rugido enviado queda grabado en el historial de `whatsapp_logs`.

## 5. 📥 El Buzón de Sugerencias (Iteraciones Inteligentes)

Donna no es estática. A través de las **Iteraciones**, el sistema se alimenta de información valiosa sin presionar al cliente.

*   **¿Cómo funciona?**: Cada vez que registras una interacción o una sugerencia del cliente, Donna extrae **palabras clave** y ejemplos.
*   **Afinidad Total**: Al usar el mismo "idioma" que el cliente, Donna genera una empatía profunda, haciendo que el cliente se sienta escuchado y comprendido a un nivel subconsciente.
*   **Mejora Continua**: El producto final se ajusta dinámicamente a estas sugerencias, asegurando que el resultado sea exactamente lo que el cliente visualiza.

---
> [!IMPORTANT]
> **El Veredicto de Confianza:** Donna es tu mano derecha. Al automatizar estos toques de atención y aprender del feedback del cliente, eliminas la fricción del seguimiento manual y aseguras que el cliente siempre sienta que estás co-creando con él.

---
> [!IMPORTANT]
> **Recuerda:** Donna es tu asistente estratégica. Los mensajes que envía a los clientes están pre-definidos para sonar profesionales y asertivos, manteniendo tu autoridad como el experto líder.
