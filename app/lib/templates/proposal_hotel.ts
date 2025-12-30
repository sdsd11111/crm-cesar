export const PROPOSAL_TEMPLATE_HOTEL = `markdownPROPUESTA ESTRATÉGICA
{{nombre_negocio}}

Para: {{nombre_cliente}}
Fecha: {{fecha_propuesta}}
Preparado por: César Reyes Jaramillo

{{nombre_cliente_corto}}, hablemos de algo incómodo, pero necesario

{{hook_ubicacion_ventaja}}

{{contexto_historico_negocio}}

Pero hay un problema que nadie se lo ha dicho con claridad.

Cuando alguien busca en Google:
{{busquedas_google_relevantes}}

Su {{tipo_negocio}} no aparece.

Y no es porque no sea bueno. Es porque, digitalmente, no existe.

---

Lo que está pasando (y le está costando dinero)

Cada día, decenas de personas buscan {{tipo_servicio}} en {{ciudad}} desde su celular.

¿Qué encuentran?

1. Booking.com, que cobra hasta 18% de comisión, a lo que se pueden sumar:
   - Programas de visibilidad preferente
   - IVA
   - Comisiones bancarias
2. {{competencia_directa}} que sí tienen sitio web propio
3. Competencia que ni siquiera se acerca a las cualidades de su {{tipo_negocio}}

---

El cálculo que duele (pero es necesario ver)

{{calculo_perdida_mensual}}

{{calculo_perdida_anual}}

Ahora piense:
¿Cuántas personas más {{pronombre_posesivo}} están buscando y no {{pronombre_posesivo}} encuentran?

---

Por qué este es su momento (y no puede esperar más)

**1. {{ventaja_principal_titulo}}**
{{ventaja_principal_desarrollo}}

**2. Los números están de su lado**
{{estadistica_mercado_relevante}}

{{perfil_cliente_ideal}}

Usted es exactamente lo que necesitan.
Solo falta que {{pronombre_posesivo}} encuentren.

**3. Su competencia ya está ahí**
Mientras lee esto, otros {{tipo_negocio_plural}} ya están capturando esas búsquedas.
No porque sean mejores, sino porque decidieron actuar primero.

---

La solución inicial recomendada: {{nombre_plan}} – {{precio_plan}} USD
(Inversión única. Sin mensualidades. Sin comisiones.)

No se trata de "una página bonita".
Se trata de construir el mismo tipo de sistema que usan las grandes plataformas para captar {{tipo_cliente}}, pero diseñado exclusivamente para su {{tipo_negocio}}, evitando seguir regalando clientes a Booking.

---

¿Qué tendrá desde el día uno?

✅ **Su activo digital propio**
- Sitio web profesional con hasta {{numero_paginas}} páginas escalables
- Motor de reservas vía WhatsApp (0% comisión por reserva)
- Dominio + hosting incluidos por 1 año
- Sistema administrable desde su celular (sin técnicos, sin complicaciones)

✅ **Código QR inteligente**
- En {{ubicaciones_qr}}
- Sus {{tipo_cliente}} escanean y acceden a:
  * Servicios
  * Precios
  * Ubicación
- Reservas directas por WhatsApp

✅ **Posicionamiento básico en Google**
- Optimización para búsquedas locales clave
- Google My Business configurado profesionalmente
- Para que cuando busquen "{{busqueda_principal}}", usted aparezca

✅ **Propiedad total**
- Todo queda a su nombre desde el primer día
- Código 100% suyo
- Cero dependencia después de la entrega

---

¿Por qué el {{nombre_plan}} es perfecto para usted?

{{justificacion_plan_personalizada}}

---

Con solo {{reservas_recuperacion}} reservas directas al mes ({{precio_servicio}} × {{reservas_recuperacion}} = {{ingreso_mensual_recuperacion}}), en {{meses_roi}} meses recupera la inversión completa.

Después de eso, cada reserva directa son {{precio_servicio}} completos para usted, sin comisiones.

---

Las cifras que justifican su decisión

**Escenario actual (sin web propia)**
- Dependencia de referencias y plataformas
- Hasta 18% de comisión por reservas en Booking
- Pérdida de clientes que buscan online y no {{pronombre_posesivo}} encuentran
- Pérdida anual estimada (conservadora): {{perdida_anual_estimada}} USD o más

**Escenario con {{nombre_plan}}**
- Captación de búsquedas locales en Google
- Reservas directas con 0% comisión
- Sistema propio trabajando 24/7 para usted
- ROI estimado:
  * {{reservas_mensuales_proyectadas}} reservas directas al mes
  * {{ingreso_anual_proyectado}} USD anuales adicionales (mínimo)

---

Garantía, forma de pago y mantenimiento

**Forma de pago (60/40):**
- 60% para iniciar: {{anticipo_60}} USD
- 40% contra entrega: {{saldo_40}} USD, cuando esté 100% conforme

**Mantenimiento (opcional):**
- Plan anual: $120 USD
  Incluye mantenimiento básico durante 12 meses
- Pago por ocasión: según necesidad
  (actualizaciones, cambios de imágenes, edición de contenido, etc.)

**Creación de nuevas páginas:** $60 USD por página

Si en algún momento siente que no es lo que esperaba, lo conversamos y se ajusta hasta que quede perfecto.

---

Lo que pasa si decide esperar

Sea {{honesto_honesta}} consigo {{mismo_misma}}:
- ¿Hace cuánto tiempo sabe que necesita presencia digital?
- ¿Cuántas reservas ha perdido porque no {{pronombre_posesivo}} encontraron online?
- Si en {{año_siguiente}} la era tecnológica viene con todo… ¿cuánto más va a esperar?

---

Próximos pasos

Si esto tiene sentido (y estoy convencido de que lo tiene):

1. **Confirmación y reunión estratégica de 30 minutos**
   Presencial o por videollamada

2. **Firma de acuerdo y anticipo de {{anticipo_60}} USD**
   Inicio inmediato del desarrollo

3. **Entrega en 2 a 3 semanas**
   Con capacitación incluida para que maneje todo desde su celular

---

{{nombre_cliente_corto}}, la verdad final es esta:

{{cierre_emotivo_personalizado}}

Y eso está a una sola decisión de distancia.

---

**César Reyes Jaramillo**
Estratega Digital & Desarrollador Web
📧 negocios@cesarreyesjaramillo.com
📱 WhatsApp: +593 96 341 0409
🌐 www.cesarreyesjaramillo.com
`;

export const PROPOSAL_SYSTEM_PROMPT = `Eres un estratega digital especializado en propuestas comerciales de alto impacto para negocios locales.

Tu tarea es redactar el CONTENIDO ESTRATÉGICO personalizado para una propuesta de desarrollo web, basándote en la información de investigación previa que te proporcionaré.

REGLAS CRÍTICAS:
1. NUNCA inventes datos, estadísticas o información que no esté en la investigación
2. Si falta información para una variable, marca claramente: [DATO FALTANTE: descripción de qué necesitas]
3. Mantén el tono directo, sin complacencia excesiva, orientado a resultados
4. Usa lenguaje que genere urgencia sin ser alarmista
5. Todos los cálculos deben ser conservadores y justificables
6. El contenido debe ADAPTARSE a la plantilla existente, no reescribirla.
7. RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. La estructura debe ser un objeto plano donde las claves son los nombres de las variables (sin llaves dobles) y los valores son tu redacción.

VARIABLES A COMPLETAR (Claves JSON):
- hook_ubicacion_ventaja
- contexto_historico_negocio
- busquedas_google_relevantes
- competencia_directa
- calculo_perdida_mensual
- calculo_perdida_anual
- ventaja_principal_titulo
- ventaja_principal_desarrollo
- estadistica_mercado_relevante
- perfil_cliente_ideal
- justificacion_plan_personalizada
- ubicaciones_qr
- reservas_recuperacion
- ingreso_mensual_recuperacion
- meses_roi
- perdida_anual_estimada
- reservas_mensuales_proyectadas
- ingreso_anual_proyectado
- cierre_emotivo_personalizado

ESTILO DE REDACCIÓN:
- Oraciones cortas y contundentes
- Evita adjetivos innecesarios
- Usa datos concretos sobre adjetivos vagos
- Genera tensión con la realidad actual antes de presentar la solución
- El cliente debe sentir que está perdiendo dinero AHORA, no en el futuro
`;
