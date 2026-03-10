"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Templates básicos
export const DEFAULT_TEMPLATES = [
    { id: 'custom', label: 'Mensaje Personalizado', text: '' },
    { id: 'receptionist', label: 'Filtro Recepción', text: 'Hola, soy asistente de César Reyes. Estamos actualizando nuestra base de datos...' },
    { id: 'owner', label: 'Contacto Directo', text: 'Hola, un gusto saludarte. Te contacto directamente porque...' },
    { id: 'promo', label: 'Promoción Vigente', text: 'Aprovecha nuestra oferta especial...' },
    { id: 'no_answer', label: 'No Contestó', text: 'Buenos días ((NOMBRE)), Intenté contactarle hace un momento,\npero no logré comunicarme, somos una consultora especializada en el sector del turismo y le comparto concretamente como le podemos ayudar:\n\n- Que un turista encuentre fácilmente su propuesta digital del hotel, su sistema de reservas, la propuesta de habitaciones, servicios complementarios y galería de fotos.\n- Que su información salga en búsquedas en Google y por ChatGPT fácilmente a quien busque por ejemplo “hoteles cerca al cementerio”. (El 80% de los viajeros usan motores de búsqueda para planificar viajes).\n- Estrategias de posicionamiento web para que las aplique con su equipo de marketing o los ejecute usted mismo. (El 57% de reservas online vienen de búsquedas orgánicas en Google).\nSi le gustaría conocer cómo hacerlo, acá está cómo lo hacemos https://www.cesarreyesjaramillo.com/motor-reservas-hotel\n\n¿Agendamos los 20 minutos?' },
    { id: 'info', label: 'Envío Información', text: '((NOMBRE)) como conversamos brevemente por teléfono, somos una consultora especializada en el sector del turismo y concretamente les ayudamos:\n\n- Que un turista encuentre fácilmente su propuesta digital del hotel, su sistema de reservas, la propuesta de habitaciones, servicios complementarios y galería de fotos.\n- Que su información salga en búsquedas en Google y por ChatGPT fácilmente a quien busque por ejemplo “hoteles cerca al cementerio”. (El 80% de los viajeros usan motores de búsqueda para planificar viajes).\n- Estrategias de posicionamiento web para que las aplique con su equipo de marketing o los ejecute usted mismo. (El 57% de reservas online vienen de búsquedas orgánicas en Google).\nSi le gustaría conocer cómo hacerlo, acá está cómo lo hacemos https://www.cesarreyesjaramillo.com/motor-reservas-hotel\n\n¿Agendamos los 20 minutos?' }
];

export interface WhatsAppTemplate {
    id: string;
    label: string;
    text: string;
}

interface WhatsAppFormProps {
    phone?: string;
    contactId?: string;
    discoveryLeadId?: string;
    onSuccess?: () => void;
    className?: string;
    initialMessage?: string;
    templates?: WhatsAppTemplate[];
}

export function WhatsAppForm({
    phone,
    contactId,
    discoveryLeadId,
    onSuccess,
    className,
    initialMessage = '',
    templates
}: WhatsAppFormProps) {
    const { toast } = useToast();
    const [template, setTemplate] = useState('custom');
    const [message, setMessage] = useState(initialMessage);
    const [isSending, setIsSending] = useState(false);
    const [destination, setDestination] = useState(phone || '');

    // Allow overriding the phone if passed props change
    useEffect(() => {
        if (phone) setDestination(phone);
    }, [phone]);

    // Use passed templates or failback to default
    const effectiveTemplates = templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES;

    const handleTemplateChange = (val: string) => {
        setTemplate(val);
        const selected = effectiveTemplates.find(t => t.id === val);
        if (selected && selected.id !== 'custom') {
            setMessage(selected.text);
        }
    };

    const handleSend = async () => {
        if (!destination || !message.trim()) {
            toast({ title: "Error", description: "Falta el número o el mensaje.", variant: "destructive" });
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: destination,
                    text: message,
                    metadata: {
                        contactId,
                        discoveryLeadId,
                        source: 'unified_component'
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast({ title: "Enviado", description: "Mensaje de WhatsApp enviado correctamente." });
                setMessage('');
                if (onSuccess) onSuccess();
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error: any) {
            toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Número Destino</label>
                <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-700 rounded-md h-9 px-3 text-xs font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    placeholder="Ej: 593999999999"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-gray-300">Plantilla Rápida</label>
                    <Select value={template} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="w-[220px] bg-gray-900 border-gray-700 text-[10px] h-8 font-bold text-green-500 shadow-sm shadow-green-500/10">
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            {effectiveTemplates.map(t => (
                                <SelectItem key={t.id} value={t.id} className="text-xs focus:bg-gray-700">
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="bg-gray-950/50 border-gray-700 min-h-[120px] text-sm resize-none focus-visible:ring-[#25D366]"
                />
            </div>

            <Button
                onClick={handleSend}
                disabled={isSending || !message.trim() || !destination}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-10 shadow-lg shadow-green-900/20"
            >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                ENVIAR WHATSAPP
            </Button>
        </div>
    );
}

interface WhatsAppQuickSenderProps {
    phone?: string;
    contactId?: string;
    discoveryLeadId?: string;
    contactName?: string;
    defaultOpen?: boolean;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    className?: string;
    templates?: WhatsAppTemplate[];
}

export function WhatsAppQuickSender({
    phone,
    contactId,
    discoveryLeadId,
    contactName = "Contacto",
    defaultOpen = false,
    trigger,
    onSuccess,
    className,
    templates
}: WhatsAppQuickSenderProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className={cn("gap-2", className)}>
                        <MessageSquare size={14} /> WhatsApp
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-100 border-gray-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#25D366] rounded-full">
                            <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        Enviar WhatsApp a {contactName}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        Gestión rápida enviada desde el CRM.
                    </DialogDescription>
                </DialogHeader>

                <WhatsAppForm
                    phone={phone}
                    contactId={contactId}
                    discoveryLeadId={discoveryLeadId}
                    onSuccess={() => {
                        setOpen(false);
                        if (onSuccess) onSuccess();
                    }}
                    templates={templates}
                />
            </DialogContent>
        </Dialog>
    );
}
