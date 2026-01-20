'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, FileText, Wand2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { fillTemplate, calculateDerivedFields } from '@/lib/contracts/utils';

interface Client {
    id: string;
    businessName: string;
    contactName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    ruc?: string;
}

export default function NewContractPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [draftContent, setDraftContent] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Review/Edit

    useEffect(() => {
        fetchClients();
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId || t.slug === selectedTemplateId);
            setSelectedTemplate(template || null);
        }
    }, [selectedTemplateId, templates]);

    async function fetchTemplates() {
        try {
            const res = await fetch('/api/contract-templates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
                if (data.length > 0) setSelectedTemplateId(data[0].slug || data[0].id);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    }

    useEffect(() => {
        // Initialize default values for the template
        if (selectedTemplate) {
            const defaults: Record<string, any> = {};
            const fields = Array.isArray(selectedTemplate.fields) ? selectedTemplate.fields : [];
            fields.forEach((f: any) => {
                if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
            });
            setFormValues(defaults);
        }
    }, [selectedTemplate]);

    useEffect(() => {
        if (selectedClient && selectedTemplate?.slug === 'hotel') {
            setFormValues(prev => ({
                ...prev,
                NOMBRE_CONTRATANTE: selectedClient.contactName,
                NOMBRE_NEGOCIO: selectedClient.businessName,
                DOMICILIO_CONTRATANTE: selectedClient.address || '',
                CEDULA_CONTRATANTE: selectedClient.ruc || '',
            }));
        }
    }, [selectedClient, selectedTemplate]);

    async function fetchClients() {
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (Array.isArray(data)) {
                setClients(data);
            } else {
                console.error('Expected clients array but got:', data);
                setClients([]);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            setClients([]);
        }
    }

    const handleFieldChange = (id: string, value: any) => {
        setFormValues(prev => ({ ...prev, [id]: value }));
    };

    const generateDraft = () => {
        if (!selectedTemplate) return;
        setIsGenerating(true);
        try {
            const derivedFields = calculateDerivedFields(selectedTemplate.slug, formValues);
            const content = fillTemplate(selectedTemplate.contentTemplate, derivedFields);
            setDraftContent(content);
            setStep(2);
        } catch (error) {
            console.error('Error generating draft:', error);
            alert('Error al generar el borrador');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveContract = async () => {
        if (!selectedClient) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClient.id,
                    title: `Contrato - ${selectedClient.businessName}`,
                    status: 'draft',
                    contractData: {
                        templateId: selectedTemplateId,
                        variables: formValues,
                        finalContent: draftContent
                    },
                }),
            });

            if (response.ok) {
                const contract = await response.json();
                router.push(`/contratos/${contract.id}`);
            } else {
                alert('Error al guardar el contrato');
            }
        } catch (error) {
            console.error('Error saving contract:', error);
            alert('Error al guardar el contrato');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => step === 2 ? setStep(1) : router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Nuevo Contrato</h1>
                    <p className="text-muted-foreground">
                        {step === 1 ? 'Completa los datos del contrato' : 'Revisa y edita el texto final'}
                    </p>
                </div>
            </div>

            {step === 1 ? (
                <div className="space-y-6">
                    {/* Template Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Seleccionar Plantilla</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una plantilla" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.slug || t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-2">{selectedTemplate?.description}</p>
                        </CardContent>
                    </Card>

                    {/* Client Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Seleccionar Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select onValueChange={(value) => {
                                const client = clients.find(c => c.id === value);
                                setSelectedClient(client || null);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Busca un cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(clients) && clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.businessName} - {client.contactName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Dynamic Fields */}
                    {selectedClient && selectedTemplate && (
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Información del Contrato</CardTitle>
                                <CardDescription>Personaliza las variables del contrato</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(selectedTemplate.fields || []).map((field: any) => (
                                        <div key={field.id} className="space-y-2">
                                            <Label htmlFor={field.id}>{field.label} {field.required && '*'}</Label>

                                            {field.type === 'string' || field.type === 'number' ? (
                                                <Input
                                                    id={field.id}
                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                    value={formValues[field.id] || ''}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    placeholder={field.placeholder}
                                                />
                                            ) : field.type === 'select' ? (
                                                <Select
                                                    value={formValues[field.id]}
                                                    onValueChange={(val) => handleFieldChange(field.id, val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options?.map((opt: any) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : field.type === 'date' ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full justify-start text-left font-normal',
                                                                !formValues[field.id] && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {formValues[field.id] ? format(new Date(formValues[field.id]), 'PPP', { locale: es }) : 'Selecciona una fecha'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={formValues[field.id] ? new Date(formValues[field.id]) : undefined}
                                                            onSelect={(date) => handleFieldChange(field.id, date)}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full mt-6"
                                    onClick={generateDraft}
                                    disabled={isGenerating}
                                >
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    {isGenerating ? 'Generando...' : 'Generar Borrador para Edición'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Editor de Contrato</CardTitle>
                                <CardDescription>Puedes modificar cualquier parte del texto antes de guardar</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                                Volver a Datos
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={draftContent}
                                onChange={(e) => setDraftContent(e.target.value)}
                                className="min-h-[600px] font-mono text-sm leading-relaxed"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                            Cancelar
                        </Button>
                        <Button className="flex-1" onClick={saveContract} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar y Ver'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
