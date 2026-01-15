'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookingProposalButtonProps {
    leadData: any;
    onProposalGenerated: (content: string) => void;
    isGenerating?: boolean;
    setIsGenerating?: (val: boolean) => void;
}

export const BookingProposalButton: React.FC<BookingProposalButtonProps> = ({
    leadData,
    onProposalGenerated,
    isGenerating: externalIsGenerating,
    setIsGenerating: externalSetIsGenerating
}) => {
    const [internalIsGenerating, setInternalIsGenerating] = React.useState(false);

    const isGenerating = externalIsGenerating !== undefined ? externalIsGenerating : internalIsGenerating;
    const setIsGenerating = externalSetIsGenerating !== undefined ? externalSetIsGenerating : setInternalIsGenerating;

    const handleGenerate = async () => {
        if (!leadData) {
            toast.error("No hay datos del lead para generar la propuesta");
            return;
        }

        setIsGenerating(true);
        try {
            // Extract business info
            const rawName = leadData.contactName || leadData.personaContacto || leadData.representative || leadData.razonSocialPropietario || '';
            const businessName = leadData.businessName || leadData.nombreComercial || leadData.nombre_comercial || 'el negocio';
            const city = leadData.city || leadData.canton || 'su zona';

            // Dynamic Business Type Logic
            const activity = (leadData.businessActivity || leadData.actividadModalidad || leadData.businessType || '').toLowerCase();
            let bizType = 'hotel'; // default

            if (activity.includes('hosteria') || activity.includes('hostería')) bizType = 'hostería';
            else if (activity.includes('hostal')) bizType = 'hostal';
            else if (activity.includes('departamento') || activity.includes('suite')) bizType = 'departamento';
            else if (activity.includes('quinta')) bizType = 'quinta';
            else if (activity.includes('hacienda')) bizType = 'hacienda';
            else if (activity.includes('motel')) bizType = 'motel';

            // Variable replacements for the booking template
            const template = `Estimada ${rawName || '((NOMBRE))'}, muy buen día.

Un gusto saludarte.
Estuve revisando la presencia digital de ${businessName} y, como te comenté, tienen una muy buena propuesta: ${bizType} nuevo, bien presentado y con excelentes valoraciones, lo cual es una gran ventaja.

Tal como quedamos, te comparto las opciones disponibles para que puedan contar con un sistema propio de reservas y pagos en línea, que funcione tanto para el equipo de recepción como para los turistas que reservan por internet.

La idea central es muy simple:
- un solo sistema para manejar habitaciones, disponibilidad y cobros, evitando depender únicamente de plataformas externas.

Opción 1 – Sistema Base de Reservas Directas

Inversión: $700 USD

Una opción funcional y clara para empezar.

Incluye:

Página web profesional propia.

Sistema de reservas en línea.

Opción de cobro por internet.

Control sencillo de habitaciones y disponibilidad.

Integración con Google para recibir reservas directas.

Todo queda a nombre del hotel.

Ideal si desean:
- Ordenar las reservas
- Cobrar por internet
- Tener control directo desde recepción

Opción 2 – Sistema Estratégico de Reservas y Visibilidad

Inversión: $1.800 USD

Incluye todo lo anterior, más:

Sitio web ampliado (hasta 20 páginas).

Contenidos orientados a turismo en ${city}:

alojamiento en el centro

turismo urbano y de paso

estadías por trabajo o visitas familiares

Optimización para aparecer mejor en Google.

Estructura pensada para que el visitante reserve, no solo consulte.

Ideal si desean:
- Aumentar reservas directas
- Reducir dependencia de intermediarios
- Aprovechar búsquedas turísticas en ${city}

Opción 3 – Sistema Avanzado de Captación Directa

Inversión: $2.800 USD

Incluye todo lo anterior, más:

Sitio web completo (hasta 40 páginas).

Estrategia de posicionamiento más amplia.

Optimización para buscadores tradicionales y nuevas búsquedas con IA.

Soporte y ajustes posteriores.

Actualización de contenidos durante 6 meses.

Ideal si desean:
- Posicionar al hotel como referencia en la ciudad
- Convertir Google en un canal constante de reservas
- Tener un sistema sólido y escalable

Cómo avanzamos

La idea es que puedas revisar estas opciones con calma y ver:

cuál se ajusta mejor a la operación del hotel,

y desde ahí ajustamos el sistema a su forma de trabajo: habitaciones, precios, pagos y reservas.

Quedo atento a tus comentarios para avanzar.

Un cordial saludo,

Ing. César Reyes Jaramillo
OBJETIVO
www.cesarreyesjaramillo.com
WhatsApp: +593 96 341 0409
Email: negocios@cesarreyesjaramillo.com`;

            onProposalGenerated(template);
            toast.success(`Propuesta de sistema para ${bizType} generada ✨`);
        } catch (error: any) {
            toast.error("Error generando propuesta: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 flex flex-col items-center py-6 h-auto gap-1"
            onClick={handleGenerate}
            disabled={isGenerating}
        >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="text-xs font-bold uppercase tracking-tighter">Propuesta Sist. Reservas</span>
        </Button>
    );
};
