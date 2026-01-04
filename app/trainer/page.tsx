'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from "next/dynamic";
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
    Info,
    Building,
    ShieldAlert,
    FileText,
    Copy,
    PenTool,
    Sparkles,
    Download
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
import { PROPOSAL_TEMPLATE_HOTEL } from '@/app/lib/templates/proposal_hotel';
import { TRAINER_WHATSAPP_TEMPLATES } from '@/app/lib/templates/trainer_whatsapp';
import { formatContactName } from '@/lib/utils/name-utils';
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { WhatsAppForm } from '@/components/whatsapp/WhatsAppQuickSender';

// Dynamic PDF Download Component
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
    ssr: false,
    loading: () => <Button disabled size="sm" className="h-8 text-xs"><Loader2 className="h-3 w-3 animate-spin" /></Button>,
});

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
    const [filterMode, setFilterMode] = useState<'all' | 'queue' | 'investigated'>('queue');
    const [isClearingQueue, setIsClearingQueue] = useState(false);

    // WhatsApp Message State
    const [waNumber, setWaNumber] = useState<string>('');
    const [waTemplate, setWaTemplate] = useState<string>('receptionist');
    const [waBody, setWaBody] = useState<string>('');
    const [isSendingWa, setIsSendingWa] = useState(false);

    // Proposal Generation State
    const [proposalVariables, setProposalVariables] = useState<any>(null);
    const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
    const [proposalContent, setProposalContent] = useState<string>('');

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

        const rawName = selectedLead.contactName || selectedLead.personaContacto || selectedLead.representative || selectedLead.razonSocialPropietario || '';
        const formattedName = formatContactName(rawName);
        const bName = selectedLead.businessName || selectedLead.nombre_comercial || '';

        // Prioritize 'owner' template if a name is available
        if (formattedName) {
            setWaTemplate('owner');
            setWaBody(TRAINER_WHATSAPP_TEMPLATES.owner(formattedName));
        } else {
            setWaTemplate('receptionist');
            setWaBody(TRAINER_WHATSAPP_TEMPLATES.receptionist());
        }

        // Reset call result form
        setCallOutcome('no_contesto');
        setCallAction('pendiente');
        setCallNotes('');
        setProposalVariables(null);
        setProposalContent('');
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
        const lead = selectedLead;
        if (lead) {
            const rawName = lead.contactName || lead.personaContacto || lead.representative || lead.razonSocialPropietario || '';
            const formattedName = formatContactName(rawName);

            if (val === 'owner') setWaBody(TRAINER_WHATSAPP_TEMPLATES.owner(formattedName));
            else if (val === 'receptionist') setWaBody(TRAINER_WHATSAPP_TEMPLATES.receptionist());
            else if (val === 'no_answer') setWaBody(TRAINER_WHATSAPP_TEMPLATES.no_answer(formattedName, lead.businessName || lead.nombre_comercial));
        }
    };

    const handleCallOutcomeChange = (val: string) => {
        if (val === 'convertir_a_lead') {
            setCallOutcome('contesto_interesado');
            setCallAction('convertir_a_lead');
        } else {
            setCallOutcome(val);
            if (val === 'contesto_interesado' && selectedLead?.source === 'discovery') {
                setCallAction('convertir_a_lead');
            }
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

                // Prioritize queed leads
                queue.forEach((l: any) => {
                    discoveryLeadsMap.set(l.id, { ...l, source: 'discovery' });
                });

                // Then investigated
                investigated.forEach((l: any) => {
                    if (!discoveryLeadsMap.has(l.id)) {
                        discoveryLeadsMap.set(l.id, { ...l, source: 'discovery' });
                    }
                });

                const list = [
                    ...Array.from(discoveryLeadsMap.values()) as any[],
                    ...leads.map((l: any) => ({ ...l, source: 'lead' }))
                ];
                setLeadsList(list);

                if (queue.length > 0 && !selectedLead) {
                    setSelectedLead({ ...queue[0], source: 'discovery' });
                } else if (investigated.length > 0 && !selectedLead) {
                    setSelectedLead({ ...investigated[0], source: 'discovery' });
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

            // Reset filter to queue (which will now be empty) or all
            setFilterMode('queue');
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
        return true; // 'all' - In all mode, we still prioritize Discovery but show everything
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
                    entityType: selectedLead.source
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`API Error: ${res.status} - ${errorText}`);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrepResult(data);
            toast.success("Estrategia generada");
        } catch (error: any) {
            console.error("Coach Prep Failure:", error);
            toast.error(`Error generando estrategia: ${error.message}`);
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
        setProposalVariables(null); // Reset proposal on lead change
        setProposalContent('');
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
                    status: selectedLead.source === 'discovery' && callAction === 'convertir_a_lead'
                        ? 'converted'
                        : (selectedLead.source === 'lead' ? callOutcome : undefined)
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
                    discoveryLeadId: selectedLead.id,
                    researchData: selectedLead.researchData || selectedLead.googleInfo || "",
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
            } else if (callAction === 'donna_reminder') {
                // Handle Donna Reminder (Same Day Follow-up)
                try {
                    const donnaRes = await fetch('/api/donna/reminder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            note: callNotes,
                            leadId: selectedLead.id,
                            leadName: selectedLead.businessName || selectedLead.contactName || "Sin Nombre",
                            source: selectedLead.source
                        })
                    });

                    if (donnaRes.ok) {
                        toast.success("🔔 Donna notificada: Recordatorio enviado a Telegram");
                    } else {
                        toast.error("Error al notificar a Donna");
                    }
                } catch (error) {
                    console.error("Donna Reminder Error", error);
                    toast.error("Error de conexión con Donna");
                }

                toast.success("Resultado guardado (Lead mantenido en cola)");
                localStorage.removeItem(`trainer_draft_${selectedLead.id}`);
                // Verify if we should move next or stay. User said "no descartarlos". 
                // Usually we move next, but the lead remains in the list.
                // Let's NOT call handleNextLead() automatically if user wants to keep working on it? 
                // Or call it to allow flow? User said "allow to call again today".
                // Default behavior: Move to next to keep flow, but lead is still in "cola".
                handleNextLead();

            } else {
                toast.success("Resultado guardado con éxito");
                localStorage.removeItem(`trainer_draft_${selectedLead.id}`); // Clear draft
                // Only move to next lead if not merely updating
                // Check logic: if "pendiente" was chosen, maybe user wants to continue?
                // Standard trainer flow usually moves next.
                handleNextLead();
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

    const handleGenerateProposal = async () => {
        if (!selectedLead) return;
        setIsGeneratingProposal(true);
        try {
            const res = await fetch('/api/trainer/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedLead.id,
                    source: selectedLead.source
                })
            });
            const data = await res.json();
            if (data.success && data.variables) {
                setProposalVariables(data.variables);

                // Replace variables in template
                let filledTemplate = PROPOSAL_TEMPLATE_HOTEL;
                Object.keys(data.variables).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    filledTemplate = filledTemplate.replace(regex, data.variables[key] || `[${key} no encontrado]`);
                });
                setProposalContent(filledTemplate);

                toast.success("Propuesta generada ✨");
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.error("Error generando propuesta: " + error.message);
        } finally {
            setIsGeneratingProposal(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 w-full max-w-[1920px] mx-auto space-y-4">
                {/* HEADER & FILTERS */}
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">High Ticket Trainer</h1>
                        <p className="text-muted-foreground text-xs mt-1">Prepara tu mente antes de marcar.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={filterMode === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterMode('all')}>Todos ({leadsList.length})</Button>
                        <Button variant={filterMode === 'queue' ? 'default' : 'outline'} size="sm" onClick={() => setFilterMode('queue')}>📋 En Cola ({leadsList.filter(l => l.source === 'discovery' && l.columna2 === 'en_cola').length})</Button>
                        <Button variant={filterMode === 'investigated' ? 'default' : 'outline'} size="sm" onClick={() => setFilterMode('investigated')}>🔍 Investigados ({leadsList.filter(l => l.source === 'discovery' && l.status === 'investigated').length})</Button>
                        <Button variant="destructive" size="sm" onClick={handleClearQueue} disabled={isClearingQueue}>
                            {isClearingQueue ? '...' : '🗑️ Limpiar'}
                        </Button>
                        <Button variant="ghost" className="px-4 py-2 hover:text-primary transition-all" onClick={handleNextLead}>
                            <ChevronRight className="mr-1 h-4 w-4" /> Sig.
                        </Button>
                    </div>
                </div>

                {/* MAIN GRID LAYOUT: 3 COLUMNS */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start h-[calc(100vh-180px)]">

                    {/* COLUMN 1: SELECTOR & CONTEXT (3 Cols) */}
                    <div className="xl:col-span-3 space-y-4 h-full flex flex-col overflow-y-auto pr-2 pb-20 custom-scrollbar">
                        {/* STEP 1: LEAD SELECTOR */}
                        <Card className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
                            <CardHeader className="p-4 py-3 border-b border-border/50">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-black">
                                    1. Selección de Prospecto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <Select
                                    value={selectedLead?.id}
                                    onValueChange={(val) => {
                                        const lead = leadsList.find(l => l.id === val);
                                        setSelectedLead(lead);
                                        setPrepResult(null); // Clear previous prep
                                    }}
                                >
                                    <SelectTrigger className="w-full h-12 text-md font-bold bg-background border-2 border-border/50 focus:border-primary transition-all rounded-xl">
                                        <SelectValue placeholder="Elegir lead..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[400px]">
                                        {filteredLeadsList.map((lead) => (
                                            <SelectItem key={lead.id} value={lead.id} className="py-2 px-3 border-b border-border/20 last:border-0 hover:bg-primary/5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white leading-tight truncate max-w-[200px]">
                                                            {lead.businessName || "Sin Nombre Comercial"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground">
                                                        {lead.source === 'discovery' ? `${lead.province || ''}, ${lead.city || ''}` : lead.businessType}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedLead && (
                                    <>
                                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/70">Contexto Actual</p>
                                                <Badge variant="outline" className="text-[9px] border-primary/20 text-primary scale-90 origin-right">
                                                    {selectedLead.status === 'investigated' ? 'Investigado' : 'Pendiente'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                                {selectedLead.source === 'discovery'
                                                    ? (selectedLead.razonSocialPropietario || selectedLead.representative || "Sin nombre registrado")
                                                    : selectedLead.contactName}
                                            </p>
                                            <div className="flex gap-1 mt-2">
                                                {selectedLead.bookingInfo && (
                                                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] px-1 font-bold">Booking</Badge>
                                                )}
                                                {selectedLead.googleInfo && (
                                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[9px] px-1 font-bold">Google Stars</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border group cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => {
                                                const phone = selectedLead.phone || selectedLead.phone1;
                                                if (phone) {
                                                    navigator.clipboard.writeText(phone);
                                                    toast.success("Teléfono copiado");
                                                }
                                            }}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Teléfono Directo</p>
                                                <p className="font-bold text-md text-primary">{selectedLead.phone || selectedLead.phone1 || 'Sin teléfono'}</p>
                                            </div>
                                            <Zap className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* STEP 2: TACTICAL MODE */}
                        <Card className="rounded-2xl border text-card-foreground shadow-lg border-primary/20 bg-primary/5 shrink-0">
                            <CardHeader className="pb-2 px-4 pt-4">
                                <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold">
                                    2. Enfoque de Llamada
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'asesor', label: 'DUEÑO', icon: User },
                                        { id: 'contencion', label: 'ENOJADO', icon: ShieldAlert },
                                        { id: 'consultor', label: 'RECEPCIÓN', icon: Building },
                                        { id: 'workshop', label: 'WORKSHOP', icon: Sparkles }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setPrepMode(mode.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-lg transition-all border border-transparent",
                                                prepMode === mode.id
                                                    ? "bg-primary text-primary-foreground shadow-md border-primary/50"
                                                    : "bg-background text-muted-foreground hover:bg-accent border-border/50"
                                            )}
                                        >
                                            <mode.icon className="h-4 w-4 mb-1" />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    className="w-full h-12 text-md font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                    onClick={handlePrepareCall}
                                    disabled={!selectedLead || isPreparing}
                                >
                                    {isPreparing ? "Procesando..." : "PREPARAR PITCH"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUMN 2: READING PANE (PITCH & RESEARCH) (5 Cols) */}
                    <div className="xl:col-span-5 h-full flex flex-col overflow-y-auto custom-scrollbar pb-20">
                        {!prepResult ? (
                            <div className="h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl text-muted-foreground bg-card/50">
                                <BrainCircuit className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg font-bold text-white/50">Esperando Frecuencia...</p>
                                <p className="text-xs text-center max-w-xs mt-2">
                                    Pulsa "Preparar Pitch" para generar tu guion táctico.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-primary/30 shadow-2xl shadow-primary/10 bg-primary/5">
                                    <CardHeader className="pb-2 border-b border-border/50 py-3 px-5">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold">
                                                Pitch de Venta Personalizado
                                            </CardTitle>
                                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                                                {prepMode.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        <div
                                            className="bg-card p-5 rounded-xl border border-border shadow-inner cursor-pointer hover:border-primary transition-all relative group"
                                            onClick={() => {
                                                const textToCopy = prepResult.pitches ? prepResult.pitches[prepMode] : prepResult.pitch;
                                                navigator.clipboard.writeText(textToCopy);
                                                toast.success("Pitch copiado al portapapeles");
                                            }}
                                        >
                                            <p className="text-base leading-relaxed text-white whitespace-pre-line">
                                                {prepResult.pitches ? prepResult.pitches[prepMode] : prepResult.pitch}
                                            </p>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge variant="outline" className="text-[9px] uppercase">Copiar</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Trigger Keywords */}
                                <div className="grid grid-cols-2 gap-3">
                                    {prepResult.disparadores?.map((d: any, i: number) => (
                                        <Card key={i} className="border-indigo-500/20 bg-indigo-500/5">
                                            <CardHeader className="p-3 pb-1">
                                                <CardTitle className="text-[9px] uppercase font-black text-indigo-400 truncate">{d.titulo || 'MANTRA'}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(d.keywords) ? d.keywords.map((kw: string, j: number) => (
                                                        <Badge key={j} variant="secondary" className="bg-indigo-500/10 text-indigo-200 border-indigo-500/30 text-[8px] px-1 py-0">
                                                            {kw}
                                                        </Badge>
                                                    )) : (
                                                        <span className="text-[8px] text-indigo-300/50 italic">Analizando...</span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Quick Info Tabs in Middle Column */}
                                <Tabs defaultValue="investigation" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 bg-background/50 border border-border/50 h-10 mb-2">
                                        <TabsTrigger value="investigation" className="text-xs uppercase font-bold">Investigación</TabsTrigger>
                                        <TabsTrigger value="details" className="text-xs uppercase font-bold">Detalles</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="investigation" className="space-y-3">
                                        {(selectedLead.investigacion || selectedLead.researchData || selectedLead.research) && (
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-background/30 p-3 rounded-lg border border-border/50 font-mono">
                                                {typeof selectedLead.researchData === 'object' && selectedLead.researchData !== null
                                                    ? Object.entries(selectedLead.researchData).map(([key, value]) => (
                                                        <div key={key} className="mb-2">
                                                            <span className="text-primary font-bold uppercase text-[8px]">{key.replace(/_/g, ' ')}:</span>
                                                            <p className="ml-2">{String(value)}</p>
                                                        </div>
                                                    ))
                                                    : (selectedLead.researchData || selectedLead.investigacion || selectedLead.research)}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            {(selectedLead.googleInfo || (selectedLead.researchData?.google_info)) && (
                                                <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                                                    <p className="text-[10px] font-black text-yellow-500 uppercase mb-1">Google Insights</p>
                                                    <p className="text-xs text-slate-300 italic">{selectedLead.googleInfo || selectedLead.researchData?.google_info || "N/A"}</p>
                                                </div>
                                            )}
                                            {(selectedLead.bookingInfo || (selectedLead.researchData?.booking_info)) && (
                                                <div className="p-3 border border-blue-500/20 bg-blue-500/5 rounded-lg">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Booking Data</p>
                                                    <p className="text-xs text-slate-300 italic">{selectedLead.bookingInfo || selectedLead.researchData?.booking_info || "N/A"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="details">
                                        <Card className="border-border/50 bg-card/30">
                                            <CardContent className="p-4 grid grid-cols-2 gap-4">
                                                <div className="col-span-2 border-b border-white/10 pb-2 mb-2">
                                                    <p className="text-[10px] uppercase font-black text-primary mb-1">Información General</p>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Razón Social / Propietario</p>
                                                    <p className="text-sm font-bold">{selectedLead.razonSocialPropietario || selectedLead.contactName || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Representante</p>
                                                    <p className="text-sm text-slate-300">{selectedLead.representative || selectedLead.contactName || "N/A"}</p>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Email</p>
                                                    <p className="text-xs text-blue-400 truncate" title={selectedLead.email}>{selectedLead.email || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Teléfono Secundario</p>
                                                    <p className="text-xs text-slate-300">{selectedLead.phone2 || selectedLead.telefonoSecundario || "N/A"}</p>
                                                </div>

                                                <div className="col-span-2 border-b border-white/10 pb-2 mb-2 mt-2">
                                                    <p className="text-[10px] uppercase font-black text-primary mb-1">Ubicación</p>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Provincia</p>
                                                    <p className="text-xs text-slate-300">{selectedLead.province || selectedLead.provincia || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Cantón / Ciudad</p>
                                                    <p className="text-xs text-slate-300">{selectedLead.canton || selectedLead.city || "N/A"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Dirección Completa</p>
                                                    <p className="text-xs text-muted-foreground">{selectedLead.address || selectedLead.direccion || "N/A"}</p>
                                                </div>

                                                <div className="col-span-2 border-b border-white/10 pb-2 mb-2 mt-2">
                                                    <p className="text-[10px] uppercase font-black text-primary mb-1">Digital & Otros</p>
                                                </div>

                                                <div className="col-span-2">
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Sitio Web</p>
                                                    <a href={selectedLead.direccionWeb || selectedLead.website || "#"} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                                        {selectedLead.direccionWeb || selectedLead.website || "N/A"}
                                                    </a>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Actividad / Tipo</p>
                                                    <p className="text-xs text-slate-300">{selectedLead.actividadModalidad || selectedLead.businessType || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Fuente</p>
                                                    <Badge variant="outline" className="text-[9px] h-5">{selectedLead.source}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>

                    {/* COLUMN 3: ACTION PANE (WHATSAPP, RESULT, PROPOSAL) (4 Cols) */}
                    <div className="xl:col-span-4 h-full flex flex-col overflow-y-auto pb-20 custom-scrollbar pr-2">
                        <Tabs defaultValue="whatsapp" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 bg-background/50 border border-border/50 h-10 mb-4 rounded-xl p-1">
                                <TabsTrigger value="whatsapp" className="rounded-lg text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-green-600 data-[state=active]:text-white">
                                    <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="result" className="rounded-lg text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <ClipboardList className="h-3 w-3 mr-1" /> Resultado
                                </TabsTrigger>
                                <TabsTrigger value="proposal" className="rounded-lg text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                                    <FileText className="h-3 w-3 mr-1" /> Propuesta
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: WHATSAPP */}
                            <TabsContent value="whatsapp">
                                <Card className="border-green-500/30 bg-green-500/5 shadow-xl">
                                    <CardHeader className="pb-2 border-b border-green-500/10 flex flex-row items-center justify-between py-4 px-5">
                                        <CardTitle className="text-xs uppercase tracking-widest text-green-500 font-bold flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" /> Gestión WhatsApp
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-4">
                                        <WhatsAppForm
                                            phone={waNumber || selectedLead?.phone1 || selectedLead?.telefonoPrincipal || selectedLead?.phone}
                                            contactId={selectedLead?.source === 'contact' || selectedLead?.source === 'lead' ? selectedLead?.id : undefined}
                                            discoveryLeadId={selectedLead?.source === 'discovery' ? selectedLead?.id : undefined}
                                            initialMessage={waBody}
                                            onSuccess={() => {
                                                // Optional: refresh history or clear selection
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TAB 2: RESULT */}
                            <TabsContent value="result">
                                <Card className="border border-input bg-card shadow-xl">
                                    <CardHeader className="py-4 px-5 border-b border-border/50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-primary" /> Registro de Llamada
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resultado</label>
                                            <Select value={callOutcome} onValueChange={handleCallOutcomeChange}>
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="contesto_interesado">✅ Contestó / Interesado</SelectItem>
                                                    <SelectItem value="contesto_no_interesado">🤝 Contestó / No Interesa hoy</SelectItem>
                                                    <SelectItem value="no_contesto">❌ No contestó</SelectItem>
                                                    <SelectItem value="convertir_a_lead" className="font-bold text-primary">🚀 Convertir a LEAD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Siguiente Paso</label>
                                            <Select value={callAction} onValueChange={setCallAction}>
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="donna_reminder">🔔 Recordatorio a Donna (Hoy)</SelectItem>
                                                    <SelectItem value="convertir_a_lead">🚀 Convertir a LEAD</SelectItem>
                                                    <SelectItem value="seguimiento_7_dias">⏳ Seguimiento (7 días)</SelectItem>
                                                    <SelectItem value="pendiente">🔄 Mantener en cola</SelectItem>
                                                    <SelectItem value="descartar">🗑️ Descartar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {callAction === 'donna_reminder' && (
                                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                                <p className="text-[10px] uppercase font-bold text-purple-400 mb-2">Nota para Donna (Telegram)</p>
                                                <Input
                                                    placeholder="Ej: Volver a llamar a las 4pm..."
                                                    value={callNotes}
                                                    onChange={(e) => setCallNotes(e.target.value)}
                                                    className="bg-background border-purple-500/20 focus:border-purple-500"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notas Generales</label>
                                            <Textarea
                                                placeholder="Detalles clave..."
                                                className="min-h-[120px] bg-background border-border"
                                                value={callNotes}
                                                onChange={(e) => setCallNotes(e.target.value)}
                                            />
                                        </div>

                                        <Button
                                            className="w-full h-12 text-md font-bold"
                                            disabled={isSavingResult || !selectedLead}
                                            onClick={handleSaveCallResult}
                                        >
                                            {isSavingResult ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                            GUARDAR RESULTADO
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TAB 3: PROPOSAL */}
                            <TabsContent value="proposal">
                                <Card className="border border-purple-500/20 bg-purple-500/5 shadow-xl h-full flex flex-col">
                                    <CardHeader className="py-4 px-5 border-b border-purple-500/10 flex-shrink-0">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-400">
                                            <Lightbulb className="h-4 w-4" /> Generador de Propuestas (IA)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-1 flex flex-col min-h-0 space-y-4">
                                        {!proposalContent && !isGeneratingProposal ? (
                                            <div className="text-center py-10 space-y-4 flex-1 flex flex-col justify-center items-center">
                                                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                                                    <BrainCircuit className="h-6 w-6 text-purple-400" />
                                                </div>
                                                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                                    Genera una propuesta personalizada basada en la investigación del prospecto.
                                                </p>
                                                <Button
                                                    onClick={handleGenerateProposal}
                                                    disabled={isGeneratingProposal || !selectedLead}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white"
                                                >
                                                    ✨ Generar Propuesta
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center gap-2 flex-shrink-0">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={handleGenerateProposal}
                                                            disabled={isGeneratingProposal || !selectedLead}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                                        >
                                                            {isGeneratingProposal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                                            Regenerar
                                                        </Button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => {
                                                            navigator.clipboard.writeText(proposalContent);
                                                            toast.success("Propuesta copiada!");
                                                        }}>
                                                            <Copy className="h-3 w-3 mr-1" /> Copiar
                                                        </Button>

                                                        {/* PDF DOWNLOAD BUTTON */}
                                                        <PDFDownloadLink
                                                            document={
                                                                <QuotationDocument
                                                                    content={proposalContent}
                                                                    logoUrl={window.location.origin + "/logo-membrete.png"}
                                                                    footerUrl={window.location.origin + "/pie-pagina.png"}
                                                                />
                                                            }
                                                            fileName={`Propuesta_${selectedLead?.businessName || 'Cliente'}.pdf`}
                                                        >
                                                            {({ blob, url, loading, error }) => (
                                                                <Button size="sm" disabled={loading} className="h-8 text-xs bg-purple-600 text-white hover:bg-purple-500">
                                                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                                                                    {loading ? 'Generando...' : 'Descargar PDF'}
                                                                </Button>
                                                            )}
                                                        </PDFDownloadLink>
                                                    </div>
                                                </div>

                                                {/* EDITABLE TEXTAREA */}
                                                <Textarea
                                                    value={proposalContent}
                                                    onChange={(e) => setProposalContent(e.target.value)}
                                                    className="flex-1 min-h-[400px] w-full resize-none p-4 rounded-lg border border-purple-500/20 bg-background/50 font-mono text-xs leading-relaxed custom-scrollbar focus:border-purple-500/50 transition-colors"
                                                    placeholder="El contenido de la propuesta aparecerá aquí..."
                                                />
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
