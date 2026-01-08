export default {
  id: 'envio_propuesta',
  subject: 'Propuesta de Valor para ((EMPRESA))',
  body: `
<p>Hola <strong>((NOMBRE))</strong>,</p>

<p>Gracias por su interés. Como conversamos, le comparto cómo podemos potenciar <strong>((EMPRESA))</strong>.</p>

<p><strong>¿En qué le ayudamos concretamente?</strong></p>

<ul style="margin: 15px 0; padding-left: 20px; line-height: 1.6;">
  <li><strong>Visibilidad Total:</strong> Que los turistas encuentren fácilmente su propuesta digital, sistema de reservas y servicios complementarios.</li>
  
  <li style="margin-top: 10px;"><strong>Dominio de Búsquedas:</strong> Que su hotel aparezca en Google y ChatGPT cuando buscan <em>“((EJEMPLO_BUSQUEDA))”</em>. (80% de viajeros usan buscadores).</li>
  
  <li style="margin-top: 10px;"><strong>Estrategia Orgánica:</strong> Implementar posicionamiento web para captar ese 57% de reservas que vienen de búsquedas orgánicas.</li>
</ul>

<p>Adjunto encontrará la propuesta detallada con el plan de acción.</p>

<p>¿Podríamos revisarla juntos brevemente?</p>

<p style="text-align: center; margin: 25px 0;">
  <a href="https://calendar.app.google/wMwRKhv9kB3x3Edz9" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">👉 Agendar Revisión</a>
</p>

<p>Saludos cordiales,</p>
  `.trim()
};
