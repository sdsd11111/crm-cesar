import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // 1. Define Contact Details
        const contact = {
            fn: "César Reyes | Objetivo CRM",
            org: "Grupo Empresarial Reyes",
            tel: "+593963410409",
            email: "negocios@cesarreyesjaramillo.com",
            url: "https://cesarreyesjaramillo.com",
            note: "Desarrollo Web, Páginas Web, Código QR, Menú Digital, Motor de Reserva, CRM, Marketing Digital, Automatización, Chatbots, WhatsApp Marketing.",
        };

        // 2. Load Logo and Convert to Base64
        const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
        let logoBase64 = '';

        try {
            if (fs.existsSync(logoPath)) {
                logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
            }
        } catch (e) {
            console.error("Error loading logo for vCard", e);
        }

        // 3. Construct vCard String (Version 3.0 is widely supported)
        let vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.fn}
N:Reyes;César;;;
ORG:${contact.org}
TEL;TYPE=cell,voice:${contact.tel}
EMAIL;TYPE=work:${contact.email}
URL:${contact.url}
NOTE:${contact.note}
CATEGORIES:Desarrollo Web,Marketing,CRM
`;

        if (logoBase64) {
            // Fold lines at 75 characters for safe transport if needed, but modern clients handle long lines okay usually. 
            // We'll keep it simple first.
            vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${logoBase64}\n`;
        }

        vCard += `END:VCARD`;

        // 4. Return as downloadable file
        return new NextResponse(vCard, {
            headers: {
                'Content-Type': 'text/vcard; charset=utf-8',
                'Content-Disposition': 'attachment; filename="Contacto_Objetivo_CRM.vcf"',
            },
        });

    } catch (error) {
        console.error("Error generating vCard", error);
        return NextResponse.json({ error: "Failed to generate vCard" }, { status: 500 });
    }
}
