'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_LIST } from '@/app/lib/templates/email_templates';

interface EmailFormProps {
    email?: string;
    contactId?: string;
    discoveryLeadId?: string;
    contactName?: string;
    businessName?: string;
    onSuccess?: () => void;
}

export function EmailForm({
    email = '',
    contactId,
    discoveryLeadId,
    contactName = '',
    businessName = '',
    onSuccess
}: EmailFormProps) {
    const [emailTo, setEmailTo] = useState(email);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);

        if (templateId && templateId !== 'custom') {
            const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
            if (template) {
                const { subject: templateSubject, body: templateBody } =
                    typeof template === 'function'
                        ? template(contactName, businessName)
                        : template;

                setSubject(templateSubject);
                setBody(templateBody);
            }
        }
    };

    const handleSend = async () => {
        // Validation
        if (!emailTo) {
            toast.error('El email destino es obligatorio');
            return;
        }

        if (!subject || !body) {
            toast.error('El asunto y el cuerpo son obligatorios');
            return;
        }

        // Check for unreplaced placeholders
        if (body.includes('((') || body.includes('))') || subject.includes('((') || subject.includes('))')) {
            if (!confirm('⚠️ El mensaje contiene etiquetas sin reemplazar (ej: ((NOMBRE))). ¿Enviar así?')) {
                return;
            }
        }

        setIsSending(true);
        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emailTo,
                    subject,
                    body,
                    contactId,
                    discoveryLeadId,
                    template: selectedTemplate
                })
            });

            const data = await res.json();

            if (data.success) {
                toast.success('📧 Email enviado correctamente');

                // Reset form
                setSubject('');
                setBody('');
                setSelectedTemplate('');

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                throw new Error(data.error || 'Error al enviar email');
            }
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Email Destination */}
            <div className="space-y-2">
                <Label htmlFor="email-to" className="text-xs font-medium text-gray-300">
                    Email Destino
                </Label>
                <Input
                    id="email-to"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="ejemplo@email.com"
                    className="w-full bg-gray-950/50 border border-gray-700 rounded-md h-9 px-3 text-xs font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-gray-300">
                        Plantilla Rápida
                    </Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="w-[220px] bg-gray-900 border-gray-700 text-[10px] h-8 font-bold text-blue-500 shadow-sm shadow-blue-500/10">
                            <SelectValue placeholder="Seleccionar plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="custom">✏️ Personalizado</SelectItem>
                            {EMAIL_TEMPLATE_LIST.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                    {template.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
                <Label htmlFor="email-subject" className="text-xs font-medium text-gray-300">
                    Asunto
                </Label>
                <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto del email..."
                    className="w-full bg-gray-950/50 border border-gray-700 rounded-md h-9 px-3 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Body */}
            <div className="space-y-2">
                <Label htmlFor="email-body" className="text-xs font-medium text-gray-300">
                    Mensaje
                </Label>
                <Textarea
                    id="email-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="bg-gray-950/50 border-gray-700 min-h-[200px] text-sm resize-none focus-visible:ring-blue-500"
                />
            </div>

            {/* Send Button */}
            <Button
                onClick={handleSend}
                disabled={isSending || !emailTo || !subject || !body}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 shadow-lg shadow-blue-900/20 rounded-full transition-all active:scale-95"
            >
                {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Send className="h-4 w-4 mr-2" />
                )}
                {isSending ? 'ENVIANDO...' : 'ENVIAR EMAIL'}
            </Button>
        </div>
    );
}
