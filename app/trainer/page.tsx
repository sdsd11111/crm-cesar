'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mic,
    Square,
    Play,
    Activity,
    User,
    Target,
    Lightbulb,
    History,
    TrendingUp,
    BrainCircuit,
    AlertCircle,
    ChevronRight,
    ClipboardList,
    Phone,
    MapPin,
    Globe,
    Calendar,
    Save,
    CheckCircle,
    XCircle,
    LayoutDashboard,
    Loader2,
    MessageSquare,
    Zap,
    Mail,
    Search,
    Info
} from 'lucide-react';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function TrainerPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [talkRatio, setTalkRatio] = useState(50); // 50% closer, 50% lead
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [leadsList, setLeadsList] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // New State for Strategic Prep
    const [prepMode, setPrepMode] = useState<string>('asesor');
    const [prepResult, setPrepResult] = useState<any>(null);
    const [isPreparing, setIsPreparing] = useState(false);

    // Call Result Form State
    const [callOutcome, setCallOutcome] = useState<string>('no_contesto');
    const [callAction, setCallAction] = useState<string>('pendiente');
    const [callNotes, setCallNotes] = useState<string>('');
    const [isSavingResult, setIsSavingResult] = useState(false);
    const [lastInteraction, setLastInteraction] = useState<any>(null);

    // Filter State
    const [filterMode, setFilterMode] = useState<'all' | 'queue' | 'investigated'>('all');
    const [isClearingQueue, setIsClearingQueue] = useState(false);

    // WhatsApp Message State
    const [waNumber, setWaNumber] = useState<string>('');
    const [waTemplate, setWaTemplate] = useState<string>('receptionist');
    const [waBody, setWaBody] = useState<string>('');
    const [isSendingWa, setIsSendingWa] = useState(false);

    const TEMPLATES = {
        receptionist: (businessName: string) => `Hola, buen día 😊
Tal como conversamos por teléfono, le comparto por aquí la información.

El enlace incluye un video corto donde explico cómo hoteles como ${businessName || '((NOMBRE DEL HOTEL))'} podrían captar más reservas directas, tanto de huéspedes nacionales como extranjeros, aprovechando su reputación en Google.

Si es tan amable, puede compartir esta información con la persona encargada, para que la revise con calma.
Quedo atento a cualquier duda.

Un saludo desde Loja,
César Reyes

👉 https://cesarreyesjaramillo.com/motor-reservas-hotel#demo-video`,
        owner: (contactName: string) => `Hola ${contactName || '((NOMBRE))'}, un gusto saludarle nuevamente 😊
Tal como conversamos por teléfono, le comparto por aquí la información.

En el enlace encontrará un video corto donde explico, de forma clara y práctica, cómo algunos hoteles están captando huéspedes nacionales y extranjeros y aumentando sus reservas directas, aprovechando su reputación online.

Revíselo con calma y, por favor, no dude en escribirme si le surge cualquier duda.
Un saludo desde Loja,
César Reyes

👉 https://cesarreyesjaramillo.com/motor-reservas-hotel#demo-video`
    };

    // Auto-populate WhatsApp and Call data from draft or defaults
    useEffect(() => {
        if (!selectedLead) return;

        const draftKey = `trainer_draft_${selectedLead.id}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setWaNumber(draft.waNumber || '');
                setWaTemplate(draft.waTemplate || 'receptionist');
                setWaBody(draft.waBody || '');
                setCallOutcome(draft.callOutcome || 'no_contesto');
                setCallAction(draft.callAction || 'pendiente');
                setCallNotes(draft.callNotes || '');
                return; // Loaded from draft, skip defaults
            } catch (e) {
                console.error("Error loading draft", e);
            }
        }

        // DEFAULT LOGIC if no draft
        const phone = selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone || '';
        setWaNumber(phone);

        const name = selectedLead.contactName || selectedLead.personaContacto || selectedLead.representative || '';
        if (name) {
            setWaTemplate('owner');
            setWaBody(TEMPLATES.owner(name));
        } else {
            setWaTemplate('receptionist');
            setWaBody(TEMPLATES.receptionist(selectedLead.businessName || selectedLead.nombre_comercial || ''));
        }

        // Reset call result form
        setCallOutcome('no_contesto');
        setCallAction('pendiente');
        setCallNotes('');
    }, [selectedLead]);

    // AUTOSAVE Effect
    useEffect(() => {
        if (!selectedLead) return;

        const draftKey = `trainer_draft_${selectedLead.id}`;
        const draft = {
            waNumber,
            waTemplate,
            waBody,
            callOutcome,
            callAction,
            callNotes
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [selectedLead, waNumber, waTemplate, waBody, callOutcome, callAction, callNotes]);

    // Update body when template changes manually
    const handleTemplateChange = (val: string) => {
        setWaTemplate(val);
        if (val === 'owner') {
            const name = selectedLead?.contactName || selectedLead?.personaContacto || selectedLead?.representative || '';
            setWaBody(TEMPLATES.owner(name));
        } else {
            const bName = selectedLead?.businessName || selectedLead?.nombre_comercial || '';
            setWaBody(TEMPLATES.receptionist(bName));
        }
    };

    const handleSendWhatsApp = async () => {
        if (!waNumber || !waBody) {
            toast.error("Número y mensaje son obligatorios");
            return;
        }

        // Devil's Advocate: Safety Check for unreplaced tags
        if (waBody.includes('((') || waBody.includes('))')) {
            if (!confirm("⚠️ El mensaje contiene etiquetas sin reemplazar (ej: ((NOMBRE))). ¿Enviar así?")) {
                return;
            }
        }

        setIsSendingWa(true);
        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: waNumber,
                    text: waBody,
                    metadata: {
                        leadId: selectedLead?.id,
                        source: 'trainer_pitch',
                        template: waTemplate
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Mensaje enviado correctamente 🚀");

                // Clear draft on success
                localStorage.removeItem(`trainer_draft_${selectedLead?.id}`);

                // Proactive Saving: If number was changed, save it to DB
                const originalPhone = selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone || '';
                if (waNumber !== originalPhone) {
                    toast.info("💾 Guardando nuevo número en la ficha...");
                    const updateUrl = selectedLead.source === 'discovery'
                        ? `/api/discovery/${selectedLead.id}`
                        : `/api/leads/${selectedLead.id}`;

                    await fetch(updateUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            telefonoPrincipal: selectedLead.source === 'discovery' ? waNumber : undefined,
                            phone: selectedLead.source === 'lead' ? waNumber : undefined
                        })
                    });
                }
            } else {
                throw new Error(data.error || "Error al enviar");
            }
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setIsSendingWa(false);
        }
    };

    // Real-time audio refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const [queueRes, investigatedRes, leadsRes] = await Promise.all([
                    fetch('/api/discovery?columna2=en_cola&limit=100'),
                    fetch('/api/discovery?status=investigated&limit=100'),
                    fetch('/api/leads')
                ]);

                let queue = [];
                let investigated = [];
                let leads = [];

                if (queueRes.ok) {
                    const data = await queueRes.json();
                    queue = data.leads || (Array.isArray(data) ? data : []);
                }
                if (investigatedRes.ok) {
                    const data = await investigatedRes.json();
                    investigated = data.leads || (Array.isArray(data) ? data : []);
                }
                if (leadsRes.ok) {
                    const data = await leadsRes.json();
                    leads = Array.isArray(data) ? data : [];
                }

                const discoveryLeadsMap = new Map();
                [...queue, ...investigated].forEach(l => {
                    discoveryLeadsMap.set(l.id, { ...l, source: 'discovery' });
                });

                const list = [
                    ...Array.from(discoveryLeadsMap.values()) as any[],
                    ...leads.map((l: any) => ({ ...l, source: 'lead' }))
                ];
                setLeadsList(list);

                if (queue.length > 0 && !selectedLead) {
                    setSelectedLead({ ...queue[0], source: 'discovery' });
                }
            } catch (error) {
                console.error("Error fetching leads for trainer:", error);
                toast.error("Error cargando prospectos.");
            }
        };
        fetchLeads();
    }, []);

    const handleClearQueue = async () => {
        if (!confirm('¿Estás seguro de limpiar todos los leads de la cola? Esta acción no se puede deshacer.')) {
            return;
        }

        setIsClearingQueue(true);
        try {
            const queueLeads = leadsList.filter((l: any) =>
                l.source === 'discovery' && l.columna2 === 'en_cola'
            );

            const results = await Promise.allSettled(
                queueLeads.map((lead: any) =>
                    fetch(`/api/discovery/${lead.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ columna2: 'pendiente' })
                    })
                )
            );

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.warning(`⚠️ Cola limpiada parcialmente: ${successful} exitosos, ${failed} fallidos`);
            } else {
                toast.success(`✅ Cola limpiada: ${successful} leads removidos`);
            }

            // Update local state instead of reload
            setLeadsList(prev => prev.map(l =>
                l.source === 'discovery' && l.columna2 === 'en_cola'
                    ? { ...l, columna2: 'pendiente' }
                    : l
            ));

            // Reset filter to show all after clearing
            setFilterMode('all');
        } catch (error) {
            console.error('Error clearing queue:', error);
            toast.error('Error al limpiar la cola');
        } finally {
            setIsClearingQueue(false);
        }
    };

    const filteredLeadsList = leadsList.filter((lead: any) => {
        if (filterMode === 'queue') {
            return lead.source === 'discovery' && lead.columna2 === 'en_cola';
        }
        if (filterMode === 'investigated') {
            return lead.source === 'discovery' && lead.status === 'investigated';
        }
        return true; // 'all'
    });

    useEffect(() => {
        const fetchLastInteraction = async () => {
            if (!selectedLead) {
                setLastInteraction(null);
                return;
            }
            try {
                const param = selectedLead.source === 'discovery'
                    ? `discoveryLeadId=${selectedLead.id}`
                    : `contactId=${selectedLead.id}`;
                const res = await fetch(`/api/interactions?${param}&limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    setLastInteraction(data[0] || null);
                }
            } catch (error) {
                console.error("Error fetching interaction:", error);
            }
        };
        fetchLastInteraction();
    }, [selectedLead]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                handleSaveRecording(blob);
            };

            // Set up simple VAD for talk ratio simulation
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
                updateTalkRatio();
            }, 1000);

            toast.success("Grabación iniciada");
        } catch (error) {
            toast.error("No se pudo acceder al micrófono");
        }
    };

    const updateTalkRatio = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((prev, curr) => prev + curr) / dataArray.length;

        // Simple logic: if volume > threshold, Closer is talking
        if (average > 30) {
            setTalkRatio(prev => Math.min(prev + 1, 90));
        } else {
            setTalkRatio(prev => Math.max(prev - 1, 10));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            toast.info("Grabación detenida. Procesando...");
        }
    };

    const handleSaveRecording = async (blob: Blob) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'call.webm');
            if (selectedLead) {
                if (selectedLead.source === 'discovery') formData.append('discoveryLeadId', selectedLead.id);
                else formData.append('leadId', selectedLead.id);
            }

            const res = await fetch('/api/trainer/analyze', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setAnalysis(data.analysis);
                toast.success("Análisis completado");
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error("Error al analizar la llamada");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePrepareCall = async () => {
        if (!selectedLead) {
            toast.error("Selecciona un prospecto primero");
            return;
        }
        setIsPreparing(true);
        setPrepResult(null);
        try {
            const res = await fetch('/api/coach/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityId: selectedLead.id,
                    entityType: selectedLead.source,
                    role: prepMode
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrepResult(data);
            toast.success("Estrategia generada");
        } catch (error) {
            toast.error("Error generando estrategia");
        } finally {
            setIsPreparing(false);
        }
    };

    const handleNextLead = () => {
        if (leadsList.length === 0) return;
        const currentIndex = leadsList.findIndex(l => l.id === selectedLead?.id);
        const nextIndex = (currentIndex + 1) % leadsList.length;
        setSelectedLead(leadsList[nextIndex]);
        setPrepResult(null);
        setCallNotes('');
    };

    const handleSaveCallResult = async () => {
        if (!selectedLead) return;
        setIsSavingResult(true);

        try {
            // 0. Proactive Phone Saving (if changed)
            const originalPhone = selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone || '';
            if (waNumber && waNumber !== originalPhone) {
                const updateUrl = selectedLead.source === 'discovery'
                    ? `/api/discovery/${selectedLead.id}`
                    : `/api/leads/${selectedLead.id}`;

                await fetch(updateUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefonoPrincipal: selectedLead.source === 'discovery' ? waNumber : undefined,
                        phone: selectedLead.source === 'lead' ? waNumber : undefined
                    })
                });
            }

            // 1. Save Interaction
            const interactionRes = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'call',
                    direction: 'outbound',
                    outcome: callOutcome,
                    content: callNotes,
                    discoveryLeadId: selectedLead.source === 'discovery' ? selectedLead.id : null,
                    contactId: selectedLead.source === 'lead' ? selectedLead.id : null,
                    performedAt: new Date().toISOString()
                })
            });

            if (!interactionRes.ok) {
                const errorData = await interactionRes.json();
                throw new Error(`Error guardando interacción: ${errorData.details || errorData.error}`);
            }

            // 2. Update Lead/Prospect Status
            const updateUrl = selectedLead.source === 'discovery'
                ? `/api/discovery/${selectedLead.id}`
                : `/api/leads/${selectedLead.id}`;

            const updateRes = await fetch(updateUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    columna1: selectedLead.source === 'discovery' ? callOutcome : undefined,
                    columna2: selectedLead.source === 'discovery' ? callAction : undefined,
                    status: selectedLead.source === 'lead' ? callOutcome : undefined
                })
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(`Error actualizando estado: ${errorData.details || errorData.error}`);
            }

            // 3. Handle 'Convertir a LEAD' Logic
            if (callAction === 'convertir_a_lead' && selectedLead.source === 'discovery') {
                // A. Smart Extraction (AI Profiler)
                let aiProfile = {};
                try {
                    if (callNotes && callNotes.length > 10) {
                        toast.info("🧠 Analizando notas con IA...");
                        const extractRes = await fetch('/api/coach/extract-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: callNotes })
                        });
                        if (extractRes.ok) {
                            aiProfile = await extractRes.json();
                            toast.success("Datos extraídos ✨");
                        }
                    }
                } catch (e) { console.error("Error extracting profile", e); }

                const extracted = aiProfile as any;
                const leadBody = {
                    businessName: selectedLead.businessName || selectedLead.nombre_comercial || "Sin Nombre",
                    contactName: extracted?.contactName || selectedLead.razonSocialPropietario || selectedLead.representative || selectedLead.personaContacto || "Sin Nombre",
                    phone: waNumber || extracted?.phone || selectedLead.phone1 || selectedLead.phone2 || "",
                    email: extracted?.email || selectedLead.email || "",
                    city: selectedLead.city || selectedLead.canton || "",
                    address: selectedLead.address || selectedLead.direccion || "",
                    businessType: selectedLead.businessType || selectedLead.actividadModalidad || "",
                    source: 'trainer_conversion',
                    status: 'nuevo',
                    notes: `Lead convertido desde Trainer.\n\n📝 Notas Originales: ${callNotes}\n\n🧠 Análisis AI:\n- Personalidad: ${extracted?.personalityType || 'N/A'}\n- Estilo: ${extracted?.communicationStyle || 'N/A'}\n- Resumen: ${extracted?.summary || ''}\n\nOutcome: ${callOutcome}`,
                    pains: selectedLead.googleInfo ? `Review Data: ${selectedLead.googleInfo}` : "",
                };

                const createLeadRes = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadBody)
                });

                if (createLeadRes.ok) {
                    toast.success("🚀 ¡Convertido a LEAD!");
                    localStorage.removeItem(`trainer_draft_${selectedLead.id}`); // Clear draft
                    // To solve "no more contacts", we should reload leads
                    window.location.reload();
                } else {
                    const errorData = await createLeadRes.json();
                    throw new Error(`Error al crear Lead real: ${errorData.details || errorData.error}`);
                }
            } else {
                toast.success("Resultado guardado con éxito");
                localStorage.removeItem(`trainer_draft_${selectedLead.id}`); // Clear draft
            }

            // Refresh interaction history locally
            const param = selectedLead.source === 'discovery'
                ? `discoveryLeadId=${selectedLead.id}`
                : `contactId=${selectedLead.id}`;
            const historyRes = await fetch(`/api/interactions?${param}&limit=1`);
            if (historyRes.ok) {
                const data = await historyRes.json();
                setLastInteraction(data[0] || null);
            }

            // Update local list
            setLeadsList(prev => prev.map(l => {
                if (l.id === selectedLead.id) {
                    return {
                        ...l,
                        columna1: selectedLead.source === 'discovery' ? callOutcome : l.columna1,
                        columna2: selectedLead.source === 'discovery' ? callAction : l.columna2,
                        status: selectedLead.source === 'lead' ? callOutcome : l.status
                    };
                }
                return l;
            }));
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar el resultado");
        } finally {
            setIsSavingResult(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">High Ticket Trainer</h1>
                        <p className="text-muted-foreground text-sm mt-2">Prepara tu mente antes de marcar.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filterMode === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterMode('all')}
                        >
                            Todos ({leadsList.length})
                        </Button>
                        <Button
                            variant={filterMode === 'queue' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterMode('queue')}
                        >
                            📋 En Cola ({leadsList.filter((l: any) => l.source === 'discovery' && l.columna2 === 'en_cola').length})
                        </Button>
                        <Button
                            variant={filterMode === 'investigated' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterMode('investigated')}
                        >
                            🔍 Investigados ({leadsList.filter((l: any) => l.source === 'discovery' && l.status === 'investigated').length})
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearQueue}
                            disabled={isClearingQueue}
                        >
                            {isClearingQueue ? 'Limpiando...' : '🗑️ Limpiar Cola'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="px-4 py-2 hover:text-primary transition-all"
                            onClick={handleNextLead}
                        >
                            <ChevronRight className="mr-1 h-4 w-4" /> Siguiente
                        </Button>
                    </div>
                </div>

                {/* MAIN TRAINER LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: CONTROL PANEL (4 units) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* STEP 1: LEAD SELECTOR */}
                        <Card className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="p-6 py-4 border-b border-border/50">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">
                                    1. Selección de Prospecto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <Select
                                    value={selectedLead?.id}
                                    onValueChange={(val) => {
                                        const lead = leadsList.find(l => l.id === val);
                                        setSelectedLead(lead);
                                        setPrepResult(null); // Clear previous prep
                                    }}
                                >
                                    <SelectTrigger className="w-full h-14 text-lg font-bold bg-background border-2 border-border/50 focus:border-primary transition-all rounded-xl">
                                        <SelectValue placeholder="Elegir lead para hoy..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[400px]">
                                        {filteredLeadsList.map((lead) => (
                                            <SelectItem key={lead.id} value={lead.id} className="py-3 px-4 border-b border-border/20 last:border-0 hover:bg-primary/5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white leading-tight">
                                                            {lead.businessName || "Sin Nombre Comercial"}
                                                        </span>
                                                        {lead.source === 'discovery' && (
                                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                                Discovery
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {lead.source === 'discovery' ? `${lead.province || ''}, ${lead.city || ''}` : lead.businessType}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedLead && (
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Contexto Actual</p>
                                            <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">
                                                {selectedLead.status === 'investigated' ? 'Investigado' : 'Pendiente'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                            {selectedLead.source === 'discovery'
                                                ? (selectedLead.razonSocialPropietario || selectedLead.representative || "Sin nombre registrado")
                                                : selectedLead.contactName}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            {selectedLead.bookingInfo && (
                                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] px-1.5 font-bold">Booking</Badge>
                                            )}
                                            {selectedLead.googleInfo && (
                                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[9px] px-1.5 font-bold">Google Stars</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedLead && (
                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border group cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => {
                                                const phone = selectedLead.phone || selectedLead.phone1;
                                                if (phone) {
                                                    navigator.clipboard.writeText(phone);
                                                    toast.success("Teléfono copiado");
                                                }
                                            }}
                                        >
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Teléfono Directo</p>
                                                <p className="font-bold text-xl text-primary">{selectedLead.phone || selectedLead.phone1 || 'Sin teléfono'}</p>
                                            </div>
                                            <Zap className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* STEP 2: TACTICAL MODE & ACTION */}
                        <Card className="rounded-2xl border text-card-foreground shadow-2xl border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3 px-6 pt-5">
                                <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold">
                                    2. Enfoque de Llamada
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 space-y-6">
                                <div className="grid grid-cols-4 gap-1 p-1 bg-background/50 rounded-lg border border-border/50">
                                    {[
                                        { id: 'asesor', emoji: '🧐', label: 'Asesor' },
                                        { id: 'consultor', emoji: '🧘', label: 'Consultor' },
                                        { id: 'vendedor', emoji: '⚡', label: 'Vendedor' },
                                        { id: 'contencion', emoji: '🛡️', label: 'Contención' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setPrepMode(mode.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-md transition-all",
                                                prepMode === mode.id
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : "text-muted-foreground hover:bg-accent"
                                            )}
                                        >
                                            <span className="text-lg mb-1">{mode.emoji}</span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    className="w-full h-16 text-xl font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                    onClick={handlePrepareCall}
                                    disabled={!selectedLead || isPreparing}
                                >
                                    {isPreparing ? "Procesando..." : "PREPARAR LLAMADA"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: AI PREPARATION & ACTION PANEL (8 units) */}
                    <div className="lg:col-span-8 space-y-6">
                        {!prepResult ? (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl text-muted-foreground bg-card/50">
                                <BrainCircuit className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-xl font-bold text-white/50">Esperando Frecuencia...</p>
                                <p className="text-sm text-center max-w-xs mt-2">
                                    Pulsa "Preparar Llamada" para generar tu pitch táctico.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                {prepResult.pitch === "SIN DATOS PARA CONTINUAR" ? (
                                    <div className="p-12 border-2 border-red-500/20 bg-red-500/5 rounded-2xl text-center space-y-4">
                                        <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                            <Zap className="h-10 w-10 text-red-400" />
                                        </div>
                                        <h2 className="text-2xl font-black text-red-400 uppercase tracking-tighter">Sin datos suficientes</h2>
                                        <p className="text-muted-foreground max-w-sm mx-auto">
                                            Este prospecto no tiene información clara de Booking o Google. Salta este contacto para mantener el ritmo.
                                        </p>
                                        <Button variant="outline" onClick={handleNextLead} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                                            Siguiente en Cola
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Tabs defaultValue="pitch" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 mb-6 bg-background/50 border border-border/50 p-1 h-14 rounded-xl">
                                                <TabsTrigger value="pitch" className="rounded-lg font-bold uppercase tracking-widest text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    <Zap className="h-4 w-4 mr-2" /> Pitch
                                                </TabsTrigger>
                                                <TabsTrigger value="info" className="rounded-lg font-bold uppercase tracking-widest text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    <User className="h-4 w-4 mr-2" /> Información
                                                </TabsTrigger>
                                                <TabsTrigger value="investigation" className="rounded-lg font-bold uppercase tracking-widest text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    <Search className="h-4 w-4 mr-2" /> Investigación
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="pitch" className="space-y-6">
                                                {/* PITCH DE VENTA PERSONALIZADO */}
                                                <Card className="border-primary/30 shadow-2xl shadow-primary/10 bg-primary/5">
                                                    <CardHeader className="pb-2 border-b border-border/50">
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">
                                                                Pitch de Venta Personalizado
                                                            </CardTitle>
                                                            <Badge className="bg-primary/20 text-primary border-primary/30">
                                                                Modo {prepMode.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-6">
                                                        <div
                                                            className="bg-card p-6 rounded-xl border border-border shadow-inner cursor-pointer hover:border-primary transition-all relative group"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(prepResult.pitch);
                                                                toast.success("Pitch copiado al portapapeles");
                                                            }}
                                                        >
                                                            <p className="text-lg leading-relaxed text-white whitespace-pre-line">
                                                                {prepResult.pitch}
                                                            </p>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Badge variant="outline" className="text-[10px] uppercase">Click para copiar</Badge>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* GRID DE DISPARADORES */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {prepResult.disparadores?.map((d: any, i: number) => (
                                                        <Card key={i} className="border-indigo-500/20 bg-indigo-500/5">
                                                            <CardHeader className="p-4 pb-2">
                                                                <CardTitle className="text-[10px] uppercase font-black text-indigo-400">{d.titulo}</CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {d.keywords.map((kw: string, j: number) => (
                                                                        <Badge key={j} variant="secondary" className="bg-indigo-500/10 text-indigo-200 border-indigo-500/30 text-[9px]">
                                                                            {kw}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>

                                                {/* WHATSAPP FOLLOW-UP PANEL */}
                                                <Card className="border-green-500/30 bg-green-500/5 shadow-xl">
                                                    <CardHeader className="pb-2 border-b border-green-500/10 flex flex-row items-center justify-between">
                                                        <CardTitle className="text-sm uppercase tracking-widest text-green-500 font-bold flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4" /> Seguimiento WhatsApp Centralizado
                                                        </CardTitle>
                                                        {waBody.includes('((') && (
                                                            <Badge variant="destructive" className="animate-pulse text-[10px]">⚠️ Etiquetas pendientes</Badge>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="pt-6 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase font-bold text-muted-foreground flex justify-between">
                                                                    Número de WhatsApp
                                                                    {waNumber !== (selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone) && (
                                                                        <span className="text-[10px] text-blue-400">✨ Nuevo número detectado</span>
                                                                    )}
                                                                </Label>
                                                                <Input
                                                                    value={waNumber}
                                                                    onChange={(e) => setWaNumber(e.target.value)}
                                                                    placeholder="Ej: 0991234567"
                                                                    className={cn(
                                                                        "bg-background/50",
                                                                        waNumber !== (selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone) && "border-blue-500/50 ring-1 ring-blue-500/20"
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase font-bold text-muted-foreground">Escoger Escenario</Label>
                                                                <Select value={waTemplate} onValueChange={handleTemplateChange}>
                                                                    <SelectTrigger className="bg-background/50">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="receptionist">🏢 Recepcionista (General)</SelectItem>
                                                                        <SelectItem value="owner">👤 Dueño (Personalizado)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Dynamic Placeholders Helpers */}
                                                        <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-lg border border-border/50">
                                                            <p className="text-[10px] text-muted-foreground w-full uppercase font-bold mb-1">Variables dinámicas:</p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-[10px] bg-primary/5 border-primary/20"
                                                                onClick={() => {
                                                                    const name = prompt("Nombre del dueño:", selectedLead.contactName || selectedLead.personaContacto || "");
                                                                    if (name) setWaBody(prev => prev.replace(/\(\(NOMBRE\)\)/g, name).replace(/Hola \w*,/g, `Hola ${name},`));
                                                                }}
                                                            >
                                                                👤 Rellenar Nombre
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-[10px] bg-primary/5 border-primary/20"
                                                                onClick={() => {
                                                                    const hotel = prompt("Nombre del hotel:", selectedLead.businessName || selectedLead.nombre_comercial || "");
                                                                    if (hotel) setWaBody(prev => prev.replace(/\(\(NOMBRE DEL HOTEL\)\)/g, hotel));
                                                                }}
                                                            >
                                                                🏨 Rellenar Hotel
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Cuerpo del Mensaje</Label>
                                                            <Textarea
                                                                value={waBody}
                                                                onChange={(e) => setWaBody(e.target.value)}
                                                                className={cn(
                                                                    "min-h-[180px] bg-background/50 leading-relaxed text-sm transition-all",
                                                                    waBody.includes('((') && "border-destructive/50 ring-1 ring-destructive/20"
                                                                )}
                                                            />
                                                        </div>

                                                        <Button
                                                            onClick={handleSendWhatsApp}
                                                            disabled={isSendingWa}
                                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-6 shadow-lg shadow-green-500/20"
                                                        >
                                                            {isSendingWa ? (
                                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                            ) : (
                                                                <Zap className="h-5 w-5 mr-2" />
                                                            )}
                                                            ENVIAR INFO POR WHATSAPP
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="info" className="space-y-4">
                                                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                            <User className="h-5 w-5 text-primary" /> Perfil Detallado
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nombre Comercial</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.businessName || selectedLead.nombre_comercial || "No registrado"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Actividad / Modalidad</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.businessType || selectedLead.actividadModalidad || "No especificado"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Razón Social (Propietario)</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.razonSocialPropietario || "No registrado"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Provincia / Cantón</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.province || selectedLead.provincia || "N/A"} - {selectedLead.city || selectedLead.canton || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Teléfonos</p>
                                                                <p className="text-md font-bold text-primary">{selectedLead.phone1 || selectedLead.telefonoPrincipal || selectedLead.phone || "N/A"} / {selectedLead.phone2 || selectedLead.telefonoSecundario || selectedLead.phone2 || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Correo Electrónico</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.email || selectedLead.correoElectronico || "No registrado"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Dirección Web</p>
                                                                <p className="text-md font-bold text-blue-400 truncate">{selectedLead.direccionWeb || selectedLead.website || "No disponible"}</p>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Persona de Contacto</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.personaContacto || selectedLead.representative || selectedLead.contactName || "No registrado"}</p>
                                                            </div>
                                                            <div className="space-y-0.5 md:col-span-2">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Correo Persona de Contacto</p>
                                                                <p className="text-md font-bold text-white">{selectedLead.correoPersonaContacto || "No registrado"}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="investigation" className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4">
                                                    {(selectedLead.investigacion || selectedLead.researchData) ? (
                                                        <Card className="border-primary/20 bg-primary/5">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-xs uppercase font-black text-primary tracking-widest flex items-center gap-2">
                                                                    <BrainCircuit className="h-4 w-4" /> Investigación Completa (IA & Web)
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-background/30 p-4 rounded-lg border border-border/50">
                                                                    {selectedLead.investigacion || selectedLead.researchData}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ) : null}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Card className="border-yellow-500/20 bg-yellow-500/5">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-xs uppercase font-black text-yellow-500 tracking-widest flex items-center gap-2">
                                                                    <Search className="h-4 w-4" /> Google Insights
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                                                    {selectedLead.googleInfo || "No hay datos de Google para este prospecto."}
                                                                </p>
                                                            </CardContent>
                                                        </Card>

                                                        <Card className="border-blue-500/20 bg-blue-500/5">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-xs uppercase font-black text-blue-400 tracking-widest flex items-center gap-2">
                                                                    <Info className="h-4 w-4" /> Booking / OTA Data
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                                                    {selectedLead.bookingInfo || "Sin datos de Booking disponibles."}
                                                                </p>
                                                            </CardContent>
                                                        </Card>
                                                    </div>

                                                    <Card className="border-primary/20 bg-primary/5">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-xs uppercase font-black text-primary tracking-widest flex items-center gap-2">
                                                                <History className="h-4 w-4" /> Última Interacción
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {lastInteraction ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <Badge variant="outline">{lastInteraction.outcome}</Badge>
                                                                        <span className="text-xs text-muted-foreground">{new Date(lastInteraction.performedAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-sm text-slate-300">{lastInteraction.content}</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground italic">No hay interacciones previas registradas.</p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </TabsContent>
                                        </Tabs>

                                        {/* ACTION PANEL */}
                                        <Card className="border-primary border-t-4 shadow-xl">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <ClipboardList className="h-5 w-5 text-primary" /> Resultado de la Llamada
                                                </CardTitle>
                                                <CardDescription>Documenta el resultado para perfilar al cliente.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">¿Qué pasó?</label>
                                                        <Select value={callOutcome} onValueChange={setCallOutcome}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Estado de contacto" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="contesto_interesado">✅ Contestó / Interesado</SelectItem>
                                                                <SelectItem value="contesto_no_interesado">🤝 Contestó / No Interesa hoy</SelectItem>
                                                                <SelectItem value="no_contesto">❌ No contestó</SelectItem>
                                                                <SelectItem value="buzon_voz">📠 Buzón de voz</SelectItem>
                                                                <SelectItem value="numero_invalido">⚠️ Número inválido</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Acción Siguiente</label>
                                                        <Select value={callAction} onValueChange={setCallAction}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Acción a tomar" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="convertir_a_lead">🚀 Convertir a LEAD</SelectItem>
                                                                <SelectItem value="seguimiento_7_dias">⏳ Seguimiento (7 días)</SelectItem>
                                                                <SelectItem value="seguimiento_30_dias">📅 Seguimiento (30 días)</SelectItem>
                                                                <SelectItem value="descartar">🗑️ Descartar</SelectItem>
                                                                <SelectItem value="pendiente">🔄 Mantener en cola</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notas de Perfilado</label>
                                                    <Textarea
                                                        placeholder="Siente que las OTAs le roban margen..."
                                                        className="min-h-[80px] bg-card border-border"
                                                        value={callNotes}
                                                        onChange={(e) => setCallNotes(e.target.value)}
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <Button
                                                        className="flex-1 h-12 text-lg font-bold"
                                                        disabled={isSavingResult || !selectedLead}
                                                        onClick={handleSaveCallResult}
                                                    >
                                                        {isSavingResult ? 'Guardando...' : 'Guardar Resultado'}
                                                        <Save className="ml-2 h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-12 px-6"
                                                        onClick={handleNextLead}
                                                    >
                                                        Saltar
                                                        <ChevronRight className="ml-2 h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

