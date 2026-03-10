# Lógica de Documentos y Formatos para Donna

Como cerebro interno, cuando César u otro miembro te solicite generar una "Cotización", "Propuesta" o "Contrato", debes estructurarlos según la siguiente lógica para mantener la congruencia en el sistema.

## 1. Cotizaciones y Propuestas
El CRM no guarda las cotizaciones como un simple PDF opaco en primera instancia, sino como un **registro estructurado en base de datos** (en la tabla `quotations`), lo que permite iterar, analizar y luego renderizar o enviar el documento final al cliente.

### Formato Base (Desglose Lógico)
Cuando redactes una cotización usando tu LLM, debes generar u obtener información de los siguientes bloques (correspondientes a los campos de la DB):

1. **`title`**: Un título claro de la propuesta (ej. *"Propuesta de Aceleración Comercial para [Empresa]"*).
2. **`introduction`**: Párrafo de apertura conectando con el negocio.
3. **`valueProposition`**: Explicación clara del valor que aportamos (por qué nosotros).
4. **`mentalTrigger`**: Frase persuasiva usando escasez, urgencia o autoridad.
5. **`roiClosing`**: Cierre centrado en números, mostrando que el costo es una inversión que se paga sola.
6. **`selectedServices`**: Listado de los servicios a entregar (se guarda como JSON array stringificado en la BD).
7. **`totalAmount`**: El costo total numérico en formato flotante/doble.

**Nota histórica:** Además de la tabla `quotations`, existe un campo de legado y conveniencia llamado `quotation` en las tablas de `leads` y `contacts`. En caso de ser una cotización rápida o menos formal, un resumen puede registrarse allí mismo en formato texto.

## 2. Contratos
El proceso de contratos funciona uniendo una plantilla dinámica y un set de datos ingresados.

### Plantilla Base (`contract_templates`)
El CRM tiene guardadas plantillas en formato de texto/Markdown en la columna `contentTemplate`, que incluyen marcadores de posición estilo Mustache, como:
`"Conste por el presente documento, el acuerdo celebrado entre Grupo Empresarial Reyes y {{businessName}}, representado por {{contactName}}..."`

### Lógica de Generación y Guardado
1. **Recopilación de variables:** Para crear el contrato, Donna debe extraer de la base de datos de clientes (`clients`) toda la información de perfilado (razón social, representante, ciudad, etc.) y rellenar estos "placeholders".
2. **Generación del registro structurado (`contractData`):** La información extraída y acodada (como montos y fechas específicas) no se fusiona en el texto y se pierde; el objeto con todos los valores resueltos debe convertirse a cadena JSON y guardarse en el campo `contractData` de la tabla `contracts`.
3. **Guardado en Archivo (`pdfUrl`):** El CRM se encargará (a través de sus rutas internas o hooks de UI) de renderizar este `contractData` en el `contentTemplate` y generar un PDF usando el frontend u otras utilidades. Si tú, Donna, tienes acceso a la función interna de generación del PDF, tu deberás hacerlo y colocar la URL final subida (ej. en Supabase Storage) en el campo `pdfUrl`.

## 3. Resumen de Flujo para Donna:
* **Me piden una cotización:** Busco el `leadId`, propongo la estructura respondiendo a los dolores del lead (`pains`, `goals`), genero el JSON estructurado, y lo inserto en `schema.quotations`.
* **Me piden un contrato:** Confirmo que el Lead sea Cliente (`clientId`), recopilo datos formales, creo el JSON de valores, inserto en `schema.contracts` incluyendo `contractData`.
