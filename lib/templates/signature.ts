// Firma profesional HTML para emails
export const EMAIL_SIGNATURE = `
<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f97316;">
  <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
    <tr>
      <td style="padding-right: 20px; vertical-align: top;">
        <img src="https://cesarreyesjaramillo.com/objetivo-logo.png" alt="OBJETIVO" width="80" height="80" style="display: block;" />
      </td>
      <td style="vertical-align: top;">
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">Ing. César Reyes Jaramillo</p>
        <p style="margin: 5px 0; font-size: 14px; color: #f97316; font-weight: 600;">CEO OBJETIVO</p>
        <p style="margin: 10px 0 5px 0; font-size: 13px; color: #4b5563;">
          <a href="https://wa.me/593963410409?text=Hola%20C%C3%A9sar%2C%20recib%C3%AD%20tu%20email%20..." style="color: #10b981; text-decoration: none; font-weight: 600;">
            📱 WhatsApp: +593 96 341 0409
          </a>
        </p>
        <p style="margin: 5px 0; font-size: 13px; color: #4b5563;">
          <a href="https://cesarreyesjaramillo.com/" style="color: #3b82f6; text-decoration: none;">
            🌐 cesarreyesjaramillo.com
          </a>
        </p>
        <p style="margin: 5px 0; font-size: 13px; color: #4b5563;">
          📧 turismo@cesarreyesjaramillo.com
        </p>
      </td>
    </tr>
  </table>
</div>
`;

// Wrapper HTML para emails profesionales
export function wrapEmailHTML(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email de OBJETIVO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with logo -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center; border-bottom: 3px solid #f97316;">
              <img src="https://cesarreyesjaramillo.com/objetivo-logo.png" alt="OBJETIVO" width="120" height="120" style="display: block; margin: 0 auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              ${EMAIL_SIGNATURE}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0;">© ${new Date().getFullYear()} OBJETIVO - Posicionamiento Real</p>
              <p style="margin: 5px 0 0 0;">Este email fue enviado desde nuestro CRM</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
