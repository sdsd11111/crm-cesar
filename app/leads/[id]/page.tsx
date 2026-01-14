'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from "next/dynamic";
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    Phone,
    Mail,
    MapPin,
    Calendar,
    MessageSquare,
    Plus,
    ArrowLeft,
    FileText,
    Sparkles,
    CheckCircle,
    Star,
    User,
    UserCheck,
    Loader2,
    Zap,
    Lightbulb,
    Target,
    Activity,
    Save,
    XCircle,
    Download,
    Copy,
    PenTool,
    ShieldAlert,
    AlertTriangle,
    History,
    Trash2,
    Building,
    Map
} from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatContactName } from '@/lib/utils/name-utils';
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UniversalContactForm } from '@/components/shared/universal-contact-form'
import { StrategicBoard } from '@/components/clients/strategic-board'
import { ProfileUpdateConfirmation } from '@/components/ai/ProfileUpdateConfirmation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MeetingBriefingCard } from '@/components/donna/MeetingBriefingCard'
import { PostMeetingReviewModal } from '@/components/donna/PostMeetingReviewModal'
import { WHATSAPP_TEMPLATES, fillWhatsAppTemplate } from '@/lib/templates/whatsapp';
import { PROPOSAL_TEMPLATE_HOTEL } from '@/app/lib/templates/proposal_hotel';
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { ConvertLeadDialog, ConversionDetails } from '@/components/leads/convert-lead-dialog'

// Dynamic PDF Download Component
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
    ssr: false,
    loading: () => <Button disabled size="sm" className="h-8 text-xs"><Loader2 className="h-3 w-3 animate-spin" /></Button>,
});

export default function LeadDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('historial')

    // Form/State for Lead
    const [isFullEditing, setIsFullEditing] = useState(false)
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
    const [newTaskData, setNewTaskData] = useState<any>({ title: '', description: '', status: 'todo', priority: 'medium' })

    // WhatsApp State
    const [waNumber, setWaNumber] = useState<string>('');
    const [waTemplate, setWaTemplate] = useState<string>('receptionist');
    const [waBody, setWaBody] = useState<string>('');
    const [isSendingWa, setIsSendingWa] = useState(false);

    // Trainer/Pitch State
    const [prepMode, setPrepMode] = useState<string>('asesor');
    const [prepResult, setPrepResult] = useState<any>(null);
    const [isPreparing, setIsPreparing] = useState(false);

    // Call Result State
    const [callOutcome, setCallOutcome] = useState<string>('no_contesto');
    const [callAction, setCallAction] = useState<string>('pendiente');
    const [callNotes, setCallNotes] = useState<string>('');
    const [isSavingResult, setIsSavingResult] = useState(false);

    const [proposalVariables, setProposalVariables] = useState<any>(null);
    const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
    const [proposalContent, setProposalContent] = useState<string>('');

    const [isConverting, setIsConverting] = useState(false)
    const [conversionDialogOpen, setConversionDialogOpen] = useState(false)
    const [isQuickInteractionOpen, setIsQuickInteractionOpen] = useState(false)

    const handleGenerateProposal = async () => {
        setIsGeneratingProposal(true);
        try {
            const res = await fetch('/api/trainer/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: params.id,
                    source: data.lead.source || 'lead'
                })
            });
            const result = await res.json();
            if (result.success && result.variables) {
                setProposalVariables(result.variables);

                // Replace variables in template
                let filledTemplate = PROPOSAL_TEMPLATE_HOTEL;

                Object.keys(result.variables).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    filledTemplate = filledTemplate.replace(regex, result.variables[key] || `[${key} no encontrado]`);
                });
                setProposalContent(filledTemplate);
                toast.success("Propuesta generada ✨");
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error("Error generando propuesta: " + error.message);
        } finally {
            setIsGeneratingProposal(false);
        }
    };

    const confirmConversion = async (data: ConversionDetails) => {
        setIsConverting(true)
        try {
            const response = await fetch(`/api/leads/${params.id}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                toast.success('¡Lead convertido a cliente exitosamente!')
                setConversionDialogOpen(false)
                fetchLeadDetails()
            } else {
                toast.error(`Error al convertir: ${result.error}`)
            }
        } catch (error) {
            toast.error('Ocurrió un error de red.')
        } finally {
            setIsConverting(false)
        }
    }

    // Donna/AI State
    const [agent, setAgent] = useState<any>(null)
    const [alerts, setAlerts] = useState<any[]>([])
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
    const [pendingChanges, setPendingChanges] = useState<any[]>([])
    const [pendingUpdates, setPendingUpdates] = useState<any>({})
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [reportContent, setReportContent] = useState('')
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)

    const fetchLeadDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/leads/${params.id}`)
            if (!response.ok) throw new Error('Failed to fetch lead')
            const result = await response.json()
            setData(result)

            // Auto-populate WhatsApp if empty
            if (result.lead) {
                const phone = result.lead.phone || result.lead.telefonoPrincipal || '';
                setWaNumber(phone);

                // Set default template
                const name = result.lead.contactName || '';
                const city = result.lead.city || 'su zona';
                const commonData = {
                    nombre: name || '((NOMBRE))',
                    hotel: result.lead.businessName || '((HOTEL))',
                    ejemplo_busqueda: `hoteles en ${city}`
                };

                if (name) {
                    setWaTemplate('owner');
                    setWaBody(fillWhatsAppTemplate(WHATSAPP_TEMPLATES.owner, commonData).text);
                } else {
                    setWaTemplate('receptionist');
                    setWaBody(fillWhatsAppTemplate(WHATSAPP_TEMPLATES.receptionist, commonData).text);
                }
            }

            // Fetch Donna Agent Status
            const agentResponse = await fetch(`/api/donna/agent/${params.id}`)
            if (agentResponse.ok) {
                const agentData = await agentResponse.json()
                setAgent(agentData.agent)
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al cargar detalles del lead')
        } finally {
            setLoading(false)
        }
    }, [params.id])

    const fetchAlerts = useCallback(async () => {
        try {
            const response = await fetch(`/api/alerts?contactId=${params.id}&status=active`)
            if (response.ok) {
                const data = await response.json()
                setAlerts(data)
            }
        } catch (error) {
            console.error('Error fetching alerts:', error)
        }
    }, [params.id])

    useEffect(() => {
        if (params.id) {
            fetchLeadDetails()
            fetchAlerts()
        }
    }, [params.id, fetchLeadDetails, fetchAlerts])

    // Load Draft from LocalStorage
    useEffect(() => {
        if (!data?.lead) return;
        const draftKey = `lead_draft_${data.lead.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.waNumber) setWaNumber(draft.waNumber);
                if (draft.waTemplate) setWaTemplate(draft.waTemplate);
                if (draft.waBody) setWaBody(draft.waBody);
                if (draft.callOutcome) setCallOutcome(draft.callOutcome);
                if (draft.callAction) setCallAction(draft.callAction);
                if (draft.callNotes) setCallNotes(draft.callNotes);
            } catch (e) { console.error("Error loading draft", e); }
        }
    }, [data?.lead]);

    // Save Draft
    useEffect(() => {
        if (!data?.lead) return;
        const draftKey = `lead_draft_${data.lead.id}`;
        localStorage.setItem(draftKey, JSON.stringify({
            waNumber, waTemplate, waBody, callOutcome, callAction, callNotes
        }));
    }, [data?.lead, waNumber, waTemplate, waBody, callOutcome, callAction, callNotes]);

    const handleSendWhatsApp = async () => {
        if (!waNumber || !waBody) {
            toast.error("Número y mensaje son obligatorios");
            return;
        }
        setIsSendingWa(true);
        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: waNumber,
                    text: waBody,
                    metadata: { leadId: data.lead.id, source: 'lead_detail' }
                })
            });
            if (res.ok) {
                toast.success("Mensaje enviado correctamente 🚀");
            } else {
                throw new Error("Error al enviar mensaje");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSendingWa(false);
        }
    };

    const handlePreparePitch = async () => {
        setIsPreparing(true);
        try {
            const response = await fetch('/api/coach/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: params.id, source: 'lead' })
            });
            const result = await response.json();
            if (result.success) {
                setPrepResult(result.data);
                toast.success("Estrategia generada con éxito");
            }
        } catch (error) {
            toast.error("Error preparando pitch");
        } finally {
            setIsPreparing(false);
        }
    };

    const handleSaveCallResult = async () => {
        setIsSavingResult(true);
        try {
            // Log interaction
            const interactionRes = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: params.id,
                    type: 'call',
                    direction: 'outbound',
                    content: callNotes,
                    outcome: callOutcome,
                    performedAt: new Date().toISOString()
                })
            });

            if (!interactionRes.ok) throw new Error("Error guardando interacción");

            // Update lead status
            await fetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: callAction === 'pendiente' ? data.lead.status : callAction })
            });

            toast.success("Resultado guardado");
            fetchLeadDetails();
            setCallNotes('');
        } catch (error) {
            toast.error("Error al guardar resultado");
        } finally {
            setIsSavingResult(false);
            setIsQuickInteractionOpen(false);
        }
    };

    const handleDonnaReminder = async () => {
        if (!callNotes) {
            toast.error("Agrega una nota primero para que Donna sepa qué recordar");
            return;
        }
        try {
            const res = await fetch('/api/donna/reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note: callNotes,
                    leadId: data.lead.id,
                    leadName: data.lead.contactName || data.lead.businessName,
                    source: 'lead_detail'
                })
            });
            if (res.ok) toast.success("Recordatorio enviado a Donna 🧠");
        } catch (e) { toast.error("Error al enviar recordatorio"); }
    };

    // Mark as Lost Functionality
    const [isLostLeadDialogOpen, setIsLostLeadDialogOpen] = useState(false);
    const [isDroppingLead, setIsDroppingLead] = useState(false);

    const handleMarkAsLost = async () => {
        setIsDroppingLead(true);
        try {
            const res = await fetch(`/api/leads/${params.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success("Lead marcado como perdido y archivado.");
                router.push('/leads');
            } else {
                throw new Error("Error al archivar lead");
            }
        } catch (error) {
            toast.error("No se pudo marcar como perdido.");
        } finally {
            setIsDroppingLead(false);
            setIsLostLeadDialogOpen(false);
        }
    };

    const history = useMemo(() => {
        if (!data?.interactions) return []
        return [...data.interactions].sort((a: any, b: any) =>
            new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
        )
    }, [data?.interactions])

    if (loading) {
        return (
            <DashboardLayout>
                <div className='flex items-center justify-center h-64'>
                    <div className='text-muted-foreground animate-pulse font-mono font-black italic'>ABRIENDO EXPEDIENTE DE LEAD...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (!data || !data.lead) {
        return (
            <DashboardLayout>
                <div className='flex flex-col items-center justify-center h-64 gap-4'>
                    <div className='text-lg text-muted-foreground'>Lead no encontrado</div>
                    <Button onClick={() => router.push('/leads')}>Volver a Leads</Button>
                </div>
            </DashboardLayout>
        )
    }

    const { lead, tasks } = data;

    return (
        <DashboardLayout>
            <div className='space-y-6'>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold tracking-tight">{lead?.contactName || lead?.businessName}</h2>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Badge variant="outline" className="font-mono text-xs">{lead?.id.split('-')[0]}</Badge>
                                <span>•</span>
                                <Badge variant="secondary" className="capitalize">{lead?.status.replace('_', ' ')}</Badge>
                                {lead.businessActivity && (
                                    <>
                                        <span>•</span>
                                        <span className="text-sm font-semibold">{lead.businessActivity}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                        onClick={() => setConversionDialogOpen(true)}
                        disabled={lead.status === 'convertido'}
                    >
                        <UserCheck className="mr-2 h-5 w-5" /> {lead.status === 'convertido' ? 'Ya es Cliente' : 'Cerrar Negocio / Convertir'}
                    </Button>
                </div>

                <ConvertLeadDialog
                    isOpen={conversionDialogOpen}
                    onClose={() => setConversionDialogOpen(false)}
                    onConfirm={confirmConversion}
                    leadName={lead?.businessName || lead?.contactName || ""}
                    isConverting={isConverting}
                    leadCity={lead?.city}
                />

                <Dialog open={isLostLeadDialogOpen} onOpenChange={setIsLostLeadDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Confirmar Pérdida
                            </DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de marcar este lead como <strong>PERDIDO</strong>?
                                <br /><br />
                                Se moverá a prospectos "Sin Interés" y se archivará.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsLostLeadDialogOpen(false)}>Cancelar</Button>
                            <Button
                                variant="destructive"
                                onClick={handleMarkAsLost}
                                disabled={isDroppingLead}
                            >
                                {isDroppingLead ? <Loader2 className="animate-spin h-4 w-4" /> : "Sí, Dar por Perdido"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl max-w-2xl mb-6">
                        <TabsTrigger value="historial" className="rounded-lg font-semibold">Historial</TabsTrigger>
                        <TabsTrigger value="estrategia" className="rounded-lg font-semibold">Estrategia AI</TabsTrigger>
                        <TabsTrigger value="ventas" className="rounded-lg font-semibold font-mono">Ventas 🚀</TabsTrigger>
                        <TabsTrigger value="tareas" className="rounded-lg font-semibold">Tareas</TabsTrigger>
                    </TabsList>

                    {/* HISTORIAL TAB */}
                    <TabsContent value="historial" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <Card className="border-none shadow-sm bg-muted/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" /> Datos de Contacto
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">{lead.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-primary" />
                                            <span>{lead.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span>{lead.city || 'N/A'}</span>
                                        </div>
                                        {lead.province && (
                                            <div className="flex items-center gap-3">
                                                <Map className="h-4 w-4 text-primary" />
                                                <span>{lead.province}</span>
                                            </div>
                                        )}
                                        {lead.businessName && (
                                            <div className="flex items-center gap-3">
                                                <Building className="h-4 w-4 text-primary" />
                                                <span className="font-semibold">{lead.businessName}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div>
                                            <Label className="text-[10px] font-bold uppercase opacity-60">Producto de Interés</Label>
                                            <p className="font-semibold text-primary">{lead.interestedProduct || 'No especificado'}</p>
                                        </div>
                                        <Separator />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setIsLostLeadDialogOpen(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Dar por Perdido
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <History className="h-5 w-5 text-primary" /> Línea de Tiempo
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {history.length > 0 ? history.map((interaction: any) => (
                                        <div key={interaction.id} className="p-4 bg-card rounded-xl border shadow-sm flex gap-4 transition-all hover:shadow-md">
                                            <div className="p-2 bg-muted rounded-lg h-fit">
                                                {interaction.type === 'call' && <Phone className="h-4 w-4 text-blue-500" />}
                                                {interaction.type === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-500" />}
                                                {interaction.type === 'note' && <FileText className="h-4 w-4 text-gray-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        {new Date(interaction.performedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-sm mt-1">{interaction.content}</p>
                                                {interaction.outcome && (
                                                    <Badge variant="outline" className="mt-2 text-[10px] opacity-70">
                                                        Resultado: {interaction.outcome}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 border-2 border-dashed rounded-xl opacity-40">
                                            Sin historia de contacto aún.
                                        </div>
                                    )}

                                    {/* Quick Interaction Button */}
                                    <Dialog open={isQuickInteractionOpen} onOpenChange={setIsQuickInteractionOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full py-8 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all group flex flex-col gap-1 items-center justify-center rounded-xl"
                                            >
                                                <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider">Registrar Nueva Interacción</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Plus className="h-5 w-5 text-primary" /> Nueva Interacción
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Registra el resultado de tu última gestión con el lead.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Resultado</Label>
                                                        <Select value={callOutcome} onValueChange={setCallOutcome}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="interesado">🔥 Interesado</SelectItem>
                                                                <SelectItem value="reunion_agendada">📅 Reunión Agendada</SelectItem>
                                                                <SelectItem value="no_contesto">🔇 No Contestó</SelectItem>
                                                                <SelectItem value="no_interesado">❌ No Interesado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Mover a Etapa</Label>
                                                        <Select value={callAction} onValueChange={setCallAction}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pendiente">Mantener Actual</SelectItem>
                                                                <SelectItem value="primer_contacto">1er Contacto</SelectItem>
                                                                <SelectItem value="segundo_contacto">2do Contacto</SelectItem>
                                                                <SelectItem value="cotizado">Cotizado / Propuesta</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Notas</Label>
                                                    <Textarea
                                                        placeholder="¿Qué pasó en esta interacción?"
                                                        value={callNotes}
                                                        onChange={(e) => setCallNotes(e.target.value)}
                                                        className="h-32"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="gap-2 sm:gap-0">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setIsQuickInteractionOpen(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    className="bg-primary hover:bg-primary/90"
                                                    onClick={handleSaveCallResult}
                                                    disabled={isSavingResult}
                                                >
                                                    {isSavingResult ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                                    Guardar Interacción
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ESTRATEGIA AI TAB */}
                    <TabsContent value="estrategia" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Tactical Pitch Preparation */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="border-indigo-100 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-indigo-500" /> Preparar Llamada
                                        </CardTitle>
                                        <CardDescription>Genera un pitch táctico con IA</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                                            onClick={handlePreparePitch}
                                            disabled={isPreparing}
                                        >
                                            {isPreparing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                            Generar Estrategia Maestra
                                        </Button>

                                        {prepResult && (
                                            <div className="space-y-3 pt-4">
                                                <Select value={prepMode} onValueChange={setPrepMode}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona Modo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="asesor">Asesor (DUEÑO)</SelectItem>
                                                        <SelectItem value="consultor">Consultor (RECEPCIÓN)</SelectItem>
                                                        <SelectItem value="vendedor">Vendedor (DUEÑO OCUPADO)</SelectItem>
                                                        <SelectItem value="contencion">Contención (ENOJADO)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 min-h-[200px]">
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Guión Táctico</p>
                                                    <div className="text-sm whitespace-pre-wrap leading-relaxed font-sans serif italic">
                                                        {prepResult.pitches[prepMode]}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Strategic Profile Analysis */}
                            <div className="lg:col-span-2">
                                <StrategicBoard client={lead} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* VENTAS TAB (WhatsApp & Proposals) */}
                    <TabsContent value="ventas" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* WhatsApp Panel */}
                            <Card className="border-green-100 shadow-md">
                                <CardHeader className="bg-green-50/50">
                                    <CardTitle className="text-green-700 flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" /> Enviar WhatsApp
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Número</Label>
                                            <Input value={waNumber} onChange={(e) => setWaNumber(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Plantilla</Label>
                                            <Select value={waTemplate} onValueChange={(val) => {
                                                setWaTemplate(val);
                                                const rawName = lead.contactName || '';
                                                const formattedName = formatContactName(rawName);
                                                const city = lead.city || 'su zona';
                                                const commonData = {
                                                    nombre: formattedName || '((NOMBRE))',
                                                    hotel: lead.businessName || '((HOTEL))',
                                                    ejemplo_busqueda: `hoteles en ${city}`
                                                };

                                                if (val === 'owner') setWaBody(fillWhatsAppTemplate(WHATSAPP_TEMPLATES.owner, commonData).text);
                                                else if (val === 'receptionist') setWaBody(fillWhatsAppTemplate(WHATSAPP_TEMPLATES.receptionist, commonData).text);
                                                else if (val === 'no_answer') setWaBody(fillWhatsAppTemplate(WHATSAPP_TEMPLATES.no_answer, commonData).text);
                                            }}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="owner">Directo al Dueño</SelectItem>
                                                    <SelectItem value="receptionist">Puente Recepción</SelectItem>
                                                    <SelectItem value="no_answer">No contestó / Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={waBody}
                                        onChange={(e) => setWaBody(e.target.value)}
                                        className="h-40 font-sans"
                                    />
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg shadow-green-200"
                                        onClick={handleSendWhatsApp}
                                        disabled={isSendingWa}
                                    >
                                        {isSendingWa ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <MessageSquare className="mr-2 h-5 w-5" />}
                                        Enviar por WhatsApp 🚀
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Call Logger & Donna Reminder */}
                            <Card className="border-blue-100 shadow-md">
                                <CardHeader className="bg-blue-50/50">
                                    <CardTitle className="text-blue-700 flex items-center gap-2">
                                        <Target className="h-5 w-5" /> Registro de Resultados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Resultado</Label>
                                            <Select value={callOutcome} onValueChange={setCallOutcome}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="interesado">🔥 Interesado</SelectItem>
                                                    <SelectItem value="reunion_agendada">📅 Reunión Agendada</SelectItem>
                                                    <SelectItem value="no_contesto">🔇 No Contestó</SelectItem>
                                                    <SelectItem value="no_interesado">❌ No Interesado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mover a Etapa</Label>
                                            <Select value={callAction} onValueChange={setCallAction}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pendiente">Mantener Actual</SelectItem>
                                                    <SelectItem value="primer_contacto">1er Contacto</SelectItem>
                                                    <SelectItem value="segundo_contacto">2do Contacto</SelectItem>
                                                    <SelectItem value="cotizado">Cotizado / Propuesta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Textarea
                                        placeholder="Agrega notas de la conversación... (Donna escuchará esto)"
                                        value={callNotes}
                                        onChange={(e) => setCallNotes(e.target.value)}
                                        className="h-32 shadow-inner"
                                    />
                                    <div className="grid grid-cols-5 gap-2">
                                        <Button
                                            variant="secondary"
                                            className="col-span-3 h-12 font-bold shadow-md"
                                            onClick={handleSaveCallResult}
                                            disabled={isSavingResult}
                                        >
                                            {isSavingResult ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Guardar Gestión
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="col-span-2 h-12 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                            onClick={handleDonnaReminder}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" /> Donna
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Proposal Generator */}
                            <Card className="lg:col-span-2 border-purple-100 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-purple-700 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" /> Propuesta con IA
                                    </CardTitle>
                                    {proposalContent && (
                                        <PDFDownloadLink
                                            document={<QuotationDocument
                                                content={proposalContent}
                                                logoUrl={typeof window !== 'undefined' ? window.location.origin + "/logo-membrete.png" : ""}
                                                footerUrl={typeof window !== 'undefined' ? window.location.origin + "/pie-pagina.png" : ""}
                                            />}
                                            fileName={`Propuesta_${lead.businessName.replace(/\s+/g, '_')}.pdf`}
                                        >
                                            {/* @ts-ignore */}
                                            {({ loading }) => (
                                                <Button variant="outline" size="sm" disabled={loading} className="border-purple-200 text-purple-700">
                                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                                    Descargar PDF
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!proposalContent ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-purple-100 rounded-xl bg-purple-50/20">
                                            <FileText className="h-12 w-12 text-purple-200 mb-4" />
                                            <p className="text-sm text-purple-400 mb-6 text-center max-w-md">
                                                Analiza el perfil del lead y genera una propuesta estratégica personalizada en segundos.
                                            </p>
                                            <Button
                                                onClick={handleGenerateProposal}
                                                disabled={isGeneratingProposal}
                                                className="bg-purple-600 hover:bg-purple-700 shadow-md"
                                            >
                                                {isGeneratingProposal ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 h-4 w-4" />}
                                                Generar Propuesta de Valor
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="p-8 bg-white border border-purple-200 rounded-xl shadow-inner min-h-[400px] overflow-auto prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800">
                                                {/* @ts-ignore */}
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                >
                                                    {proposalContent}
                                                </ReactMarkdown>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="flex-1" onClick={() => setProposalContent('')}>
                                                    Regenerar
                                                </Button>
                                                <Button variant="secondary" className="flex-1" onClick={() => {
                                                    navigator.clipboard.writeText(proposalContent);
                                                    toast.success("Copiado al portapapeles");
                                                }}>
                                                    <Copy className="h-4 w-4 mr-2" /> Copiar Texto
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAREAS TAB */}
                    <TabsContent value="tareas" className="space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xl font-bold">Compromisos y Seguimiento</CardTitle>
                                <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Nueva Tarea
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {tasks?.length > 0 ? (
                                    tasks.map((task: any) => (
                                        <div key={task.id} className="p-4 bg-muted/20 border rounded-xl flex items-start gap-4 transition-transform hover:scale-[1.01]">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                            <div className="flex-1">
                                                <p className="font-bold">{task.title}</p>
                                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                            </div>
                                            <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>{task.priority}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 opacity-40">
                                        No hay tareas pendientes.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Task Dialog */}
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={newTaskData.title} onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea value={newTaskData.description} onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={async () => {
                            await fetch('/api/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...newTaskData, contactId: params.id })
                            });
                            toast.success("Tarea creada");
                            setIsTaskDialogOpen(false);
                            fetchLeadDetails();
                        }}>Crear Compromiso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
