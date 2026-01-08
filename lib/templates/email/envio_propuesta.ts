export default {
    id: 'envio_propuesta',
    subject: 'Propuesta Personalizada para ((EMPRESA))',
    body: `
<p>Hola <strong>((NOMBRE))</strong>,</p>

<p>Ha sido un placer conversar contigo sobre los objetivos de <strong>((EMPRESA))</strong>.</p>

<p>Adjunto encontrarás una propuesta personalizada que he preparado específicamente para tu negocio, considerando los puntos que discutimos en nuestra última conversación.</p>

<p>Esta propuesta incluye:</p>
<ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
  <li>Análisis de tu situación actual</li>
  <li>Estrategia recomendada</li>
  <li>Plan de implementación</li>
  <li>Inversión y retorno esperado</li>
</ul>

<p>Estoy disponible para revisar la propuesta contigo y resolver cualquier duda que puedas tener.</p>

<p>¿Cuándo te vendría bien agendar una llamada para discutir los detalles?</p>

<p>Saludos cordiales,</p>
  `.trim()
};
