'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookingProposalButtonProps {
    leadData: any;
    onProposalGenerated: (content: string) => void;
    compliment?: string;
    isGenerating?: boolean;
    setIsGenerating?: (val: boolean) => void;
}

export const BookingProposalButton: React.FC<BookingProposalButtonProps> = ({
    leadData,
    onProposalGenerated,
    compliment,
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

            // NEW: Use template from lib/templates
            const { default: proposalTemplate } = await import('@/lib/templates/booking/proposal_v2');
            console.log("Loaded template content first 100 chars:", proposalTemplate.text.substring(0, 100));

            let template = proposalTemplate.text;
            const placeholders: Record<string, string> = {
                'NOMBRE': rawName || 'Prospecto',
                'HOTEL': businessName,
                'UBICACION': city,
                'BIZ_TYPE': bizType,
                'HALAGO': compliment || 'tienen una muy buena propuesta, gran reputación y excelentes comentarios'
            };

            // Replace all placeholders ((KEY))
            Object.entries(placeholders).forEach(([key, value]) => {
                const regex = new RegExp(`\\(\\(${key}\\)\\)`, 'g');
                template = template.replace(regex, value);
            });

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
