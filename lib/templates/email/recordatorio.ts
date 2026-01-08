export default {
    id: 'recordatorio',
    subject: 'Recordatorio - Reunión con ((EMPRESA))',
    body: `
<p>Hola <strong>((NOMBRE))</strong>,</p>

<p>Te escribo para recordarte nuestra reunión programada para <strong>((FECHA))</strong> a las <strong>((HORA))</strong>.</p>

<p>Temas a tratar:</p>
<ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
  <li>Revisión de la propuesta</li>
  <li>Resolución de dudas</li>
  <li>Próximos pasos</li>
</ul>

<p>Si necesitas reprogramar o tienes alguna pregunta antes de la reunión, no dudes en contactarme.</p>

<p>¡Nos vemos pronto!</p>

<p>Saludos cordiales,</p>
  `.trim()
};
