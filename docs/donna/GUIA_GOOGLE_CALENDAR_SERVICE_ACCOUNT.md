# Guía de Configuración: Credenciales Google Calendar (Service Account)

Sigue estos pasos EXACTOS basándonos en la pantalla que me mostraste.

### PASO 1: Selección del Tipo de Credencial (Tu pantalla actual)
1.  En la sección **"¿A qué datos quieres acceder?"**, selecciona la opción:
    -   🔘 **Datos de aplicaciones** (La segunda opción).
    -   *Por qué:* Porque Donna es un "robot" (aplicación backend) que trabajará por ti, no es un usuario humano logueándose.
2.  Haz clic en el botón azul **"Siguiente"**.

### PASO 2: Crear la Cuenta de Servicio
1.  Te pedirá **"Nombre de la cuenta de servicio"**.
    -   Escribe: `donna-crm-bot`
2.  (Opcional) Descripción: "Bot para agendar citas desde CRM".
3.  Haz clic en **"Crear y Continuar"**.
4.  En **"Conceder a esta cuenta de servicio acceso al proyecto"**:
    -   Selecciona el rol: **Básico** -> **Propietario** (Owner). (Esto es lo más fácil para evitar problemas de permisos).
5.  Haz clic en **"Continuar"** y luego en **"Listo"**.

### PASO 3: Generar la Llave (El Archivo JSON)
Ahora volverás a la lista de credenciales.
1.  Busca la sección **"Cuentas de servicio"** (o Service Accounts).
2.  Haz clic sobre el **email** que se acaba de crear (ej: `donna-crm-bot@tu-proyecto.iam.gserviceaccount.com`).
3.  Ve a la pestaña **"Claves"** (o Keys) en la parte superior.
4.  Haz clic en **"Agregar clave"** -> **"Crear clave nueva"**.
5.  Selecciona el tipo: **JSON**.
6.  Haz clic en **"Crear"**.
7.  **¡IMPORTANTE!** Se descargará un archivo automáticamente a tu computadora.
    -   Renombra ese archivo a: `google_credentials.json`
    -   Guárdalo en la carpeta raíz de tu proyecto CRM (junto a `package.json`, `.env.local`, etc).

### PASO 4: Conectar tu Calendario Personal
Para que este robot pueda escribir en TU calendario real:
1.  Abre tu [Google Calendar](https://calendar.google.com/).
2.  En el menú izquierdo, busca tu calendario ("Cesar Reyes" o el principal).
3.  Clic en los 3 puntos verticales -> **"Configuración y uso compartido"**.
4.  Baja hasta la sección **"Compartir con personas o grupos específicos"**.
5.  Haz clic en **"Agregar personas"**.
6.  **Pega el email del robot** (ej: `donna-crm-bot@tu-proyecto.iam.gserviceaccount.com`).
    -   *Nota: Este email está en el archivo JSON que descargaste, campo `client_email`.*
7.  En **Permisos**, selecciona: **"Realizar cambios en eventos"**.
8.  Clic en **"Enviar"**.

### ¡Listo!
Con esto, Donna ya tiene permiso para crear eventos. Avísame cuando hayas guardado el archivo JSON en el proyecto.
