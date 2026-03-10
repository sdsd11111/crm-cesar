"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Mic, User, CheckCircle, Sparkles, Telescope, BarChart2, Handshake, FileText, X, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { MultiProductSelector } from "@/components/recorridos/multi-product-selector"
import { getProducts } from "@/app/actions/product-actions"
import { toast } from "sonner"

// Use standard lucide-react icons
import { Mic as MicIcon, User as UserIcon, CheckCircle as CheckIcon, Sparkles as SparkleIcon, Telescope as TeleIcon, BarChart2 as ChartIcon, Handshake as HandIcon, FileText as FileIcon, X as XIcon, Home as HomeIcon } from "lucide-react"

interface UniversalContactFormProps {
    contactId?: string | null
    initialData?: any
    mode: "lead" | "client"
    onSave?: () => void
    onCancel?: () => void
    onBack?: () => void // For Recorridos flow
}

const sectionIcons: { [key: number]: React.ElementType } = {
    1: UserIcon,
    2: TeleIcon,
    3: ChartIcon,
    4: HandIcon,
    5: FileIcon,
    6: SparkleIcon,
}

export function UniversalContactForm({
    contactId,
    initialData,
    mode,
    onSave,
    onCancel,
    onBack
}: UniversalContactFormProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [animation, setAnimation] = useState("animate-slide-in-right")
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [transcribingField, setTranscribingField] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [products, setProducts] = useState<any[]>([])

    const [formData, setFormData] = useState({
        businessName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        businessActivity: "",
        relationshipType: "",
        birthday: "",
        interestedProduct: [] as string[],
        pains: "",
        goals: "",
        objections: "",
        quantifiedProblem: "",
        conservativeGoal: "",
        verbalAgreements: "",
        yearsInBusiness: "",
        numberOfEmployees: "",
        numberOfBranches: "",
        currentClientsPerMonth: "",
        averageTicket: "",
        knownCompetition: "",
        highSeason: "",
        criticalDates: "",
        anniversaryDate: "",
        facebookFollowers: "",
        otherAchievements: "",
        specificRecognitions: "",
        personalityType: "",
        communicationStyle: "",
        keyPhrases: "",
        strengths: "",
        weaknesses: "",
        opportunities: "",
        threats: "",
        contractValue: "", // Specifically for clients
    })

    useEffect(() => {
        async function loadProducts() {
            const result = await getProducts();
            if (result.success && result.data) {
                setProducts(result.data);
            }
        }
        loadProducts();
    }, [])

    useEffect(() => {
        if (contactId && !initialData) {
            const fetchContact = async () => {
                const type = mode === 'lead' ? 'leads' : 'clients';
                const res = await fetch(`/api/${type}/${contactId}`);
                if (res.ok) {
                    const data = await res.json();
                    mapDataToForm(data.client || data);
                }
            };
            fetchContact();
        } else if (initialData) {
            mapDataToForm(initialData);
        }
    }, [contactId, initialData, mode]);

    const mapDataToForm = (data: any) => {
        setFormData({
            businessName: data.businessName || "",
            contactName: data.contactName || "",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            city: data.city || "",
            businessActivity: data.businessActivity || "",
            relationshipType: data.relationshipType || "",
            birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : "",
            interestedProduct: Array.isArray(data.interestedProduct)
                ? data.interestedProduct
                : (typeof data.interestedProduct === 'string' && data.interestedProduct.length > 0
                    ? data.interestedProduct.split(',').map((s: string) => s.trim())
                    : []),
            pains: data.pains || "",
            goals: data.goals || "",
            objections: data.objections || "",
            quantifiedProblem: data.quantifiedProblem || "",
            conservativeGoal: data.conservativeGoal || "",
            verbalAgreements: data.verbalAgreements || "",
            yearsInBusiness: data.yearsInBusiness?.toString() || "",
            numberOfEmployees: data.numberOfEmployees?.toString() || "",
            numberOfBranches: data.numberOfBranches?.toString() || "",
            currentClientsPerMonth: data.currentClientsPerMonth?.toString() || "",
            averageTicket: data.averageTicket?.toString() || "",
            knownCompetition: data.knownCompetition || "",
            highSeason: data.highSeason || "",
            criticalDates: data.criticalDates || "",
            anniversaryDate: data.anniversaryDate ? new Date(data.anniversaryDate).toISOString().split('T')[0] : "",
            facebookFollowers: data.facebookFollowers?.toString() || "",
            otherAchievements: data.otherAchievements || "",
            specificRecognitions: data.specificRecognitions || "",
            personalityType: data.personalityType || "",
            communicationStyle: data.communicationStyle || "",
            keyPhrases: data.keyPhrases || "",
            strengths: data.strengths || "",
            weaknesses: data.weaknesses || "",
            opportunities: data.opportunities || "",
            threats: data.threats || "",
            contractValue: data.contractValue?.toString() || "",
        });
    }

    const steps = [
        { id: 1, title: "Información Fundamental" },
        { id: 2, title: "Perfilado y Necesidades" },
        { id: 3, title: "Contexto y Rendimiento" },
        { id: 4, title: "Perfil y Análisis Estratégico" },
        { id: 5, title: "Revisión" },
        { id: 6, title: "Éxito" },
    ]

    const handleNext = () => {
        if (currentStep < steps.length) {
            setAnimation("animate-slide-out-left")
            setTimeout(() => {
                setCurrentStep(currentStep + 1)
                setAnimation("animate-slide-in-right")
            }, 400)
        }
    }

    const handlePrev = () => {
        if (currentStep > 1) {
            setAnimation("animate-slide-out-left")
            setTimeout(() => {
                setCurrentStep(currentStep - 1)
                setAnimation("animate-slide-in-right")
            }, 400)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const startRecording = async (field: string) => {
        if (isRecording) {
            mediaRecorder?.stop()
            setIsRecording(false)
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: BlobPart[] = []

            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/wav" })
                await transcribeAudio(blob, field)
                stream.getTracks().forEach((track) => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            toast.error("No se pudo acceder al micrófono")
        }
    }

    const transcribeAudio = async (audioBlob: Blob, field: string) => {
        setTranscribingField(field)
        setIsTranscribing(true)
        try {
            const form = new FormData()
            form.append("audio", audioBlob, "recording.wav")

            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: form,
            })

            if (response.ok) {
                const { transcription } = await response.json()
                const currentValue = formData[field as keyof typeof formData]
                const newValue = Array.isArray(currentValue) ? currentValue.join(', ') : currentValue;
                const updatedValue = newValue ? `${newValue}\n${transcription}` : transcription
                handleInputChange(field, updatedValue)
            } else {
                toast.error("Error al transcribir")
            }
        } catch (error) {
            toast.error("Error en la transcripción")
        } finally {
            setIsTranscribing(false)
            setTranscribingField(null)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const type = mode === 'lead' ? 'leads' : 'clients';
            const url = contactId ? `/api/${type}/${contactId}` : `/api/${type}`;
            const method = contactId ? (mode === 'lead' ? 'PUT' : 'PATCH') : 'POST';

            const submissionData = {
                ...formData,
                interestedProduct: Array.isArray(formData.interestedProduct)
                    ? formData.interestedProduct.join(', ')
                    : formData.interestedProduct,
                yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
                numberOfEmployees: formData.numberOfEmployees ? parseInt(formData.numberOfEmployees) : null,
                numberOfBranches: formData.numberOfBranches ? parseInt(formData.numberOfBranches) : null,
                currentClientsPerMonth: formData.currentClientsPerMonth ? parseInt(formData.currentClientsPerMonth) : null,
                averageTicket: formData.averageTicket ? parseInt(formData.averageTicket) : null,
                facebookFollowers: formData.facebookFollowers ? parseInt(formData.facebookFollowers) : null,
                contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                toast.success(contactId ? "Expediente actualizado" : "Expediente creado");
                if (onSave) onSave();
                handleNext(); // Move to success step (Step 6)
            } else {
                const errorData = await response.json();
                toast.error(`Error: ${errorData.details || errorData.error || 'Error desconocido'}`);
            }
        } catch (error) {
            toast.error("Error al guardar los cambios");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (fieldName: keyof typeof formData, label: string, type: string = "text") => (
        <div className="relative mb-6">
            <Input
                id={fieldName}
                type={type}
                value={formData[fieldName] as string}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                placeholder=" "
                className="peer w-full p-4 border-2 border-muted rounded-xl bg-background transition-all focus:border-primary"
            />
            <label htmlFor={fieldName} className="absolute top-4 left-5 text-muted-foreground transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-4 peer-focus:scale-90 peer-focus:text-primary peer-focus:bg-background peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-2">
                {label}
            </label>
        </div>
    )

    const renderTextarea = (fieldName: keyof typeof formData, label: string) => (
        <div className="relative mb-6">
            <Textarea
                id={fieldName}
                value={formData[fieldName] as string}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                placeholder=" "
                className="peer w-full p-4 border-2 border-muted rounded-xl bg-background transition-all focus:border-primary min-h-[100px] pr-12"
            />
            <label htmlFor={fieldName} className="absolute top-4 left-5 text-muted-foreground transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-4 peer-focus:scale-90 peer-focus:text-primary peer-focus:bg-background peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-2">
                {label}
            </label>
            <Button type="button" size="icon" onClick={() => startRecording(fieldName)} disabled={isTranscribing && transcribingField !== fieldName} className={cn("absolute top-3 right-3 w-8 h-8 rounded-full", isRecording && transcribingField === fieldName ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-primary/10 text-primary")}>
                {(isTranscribing && transcribingField === fieldName) ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <MicIcon className="w-4 h-4" />}
            </Button>
        </div>
    )

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-6">Información Fundamental</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField("businessName", "Nombre del Negocio")}
                            {renderField("contactName", "Nombre del Contacto")}
                            {renderField("phone", "Teléfono")}
                            {renderField("email", "Email")}
                            {renderField("city", "Ciudad")}
                            <div className="relative mb-6">
                                <Select
                                    value={(formData as any).businessType}
                                    onValueChange={(val) => handleInputChange("businessType", val)}
                                >
                                    <SelectTrigger className="w-full p-4 border-2 border-muted rounded-xl h-auto bg-background">
                                        <SelectValue placeholder="Tipo de Negocio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Restaurante">Restaurante</SelectItem>
                                        <SelectItem value="Hotel">Hotel</SelectItem>
                                        <SelectItem value="Gimnasio">Gimnasio</SelectItem>
                                        <SelectItem value="Inmobiliaria">Inmobiliaria</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {renderField("address", "Dirección Física")}
                        {renderTextarea("businessActivity", "Actividad Comercial Principal")}
                        {renderField("relationshipType", "Tipo de Relación")}
                        {renderField("birthday", "Cumpleaños del Contacto", "date")}
                    </div>
                )
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-6">Diagnóstico y Necesidades</h3>
                        <MultiProductSelector
                            products={products}
                            selectedProducts={formData.interestedProduct}
                            onSelectionChange={(selected) => handleInputChange("interestedProduct", selected as any)}
                            label={mode === 'client' ? "Productos Contratados" : "Productos de Interés"}
                        />
                        {renderTextarea("pains", "Dolores y Problemas")}
                        {renderTextarea("goals", "Metas y Objetivos")}
                        {renderTextarea("objections", "Objeciones y Barreras")}
                        {renderTextarea("quantifiedProblem", "Problema Cuantificado")}
                        {renderTextarea("conservativeGoal", "Objetivo Conservador")}
                        {renderTextarea("verbalAgreements", "Acuerdos Verbales")}
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-6">Contexto y Rendimiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField("yearsInBusiness", "Años en el negocio", "number")}
                            {renderField("numberOfEmployees", "Número de empleados", "number")}
                            {renderField("numberOfBranches", "Número de sucursales", "number")}
                            {renderField("currentClientsPerMonth", "Clientes por mes", "number")}
                            {renderField("averageTicket", "Ticket promedio", "number")}
                            {renderField("facebookFollowers", "Seguidores FB", "number")}
                            {mode === 'client' && renderField("contractValue", "Valor del Contrato", "number")}
                        </div>
                        {renderTextarea("knownCompetition", "Competencia")}
                        {renderTextarea("otherAchievements", "Otros logros")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField("highSeason", "Temporada alta")}
                            {renderField("criticalDates", "Fechas críticas")}
                            {renderField("anniversaryDate", "Aniversario del Negocio", "date")}
                        </div>
                    </div>
                )
            case 4:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-6">Perfil Humano y Estratégico</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField("personalityType", "Estilo de Decisión")}
                            {renderField("communicationStyle", "Estilo de Comunicación")}
                        </div>
                        {renderTextarea("keyPhrases", "Frases Clave")}
                        <h4 className="font-semibold mt-4 mb-2">Análisis FODA</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTextarea("strengths", "Fortalezas")}
                            {renderTextarea("weaknesses", "Debilidades")}
                            {renderTextarea("opportunities", "Oportunidades")}
                            {renderTextarea("threats", "Amenazas")}
                        </div>
                    </div>
                )
            case 5:
                return (
                    <div className="text-center space-y-6">
                        <h3 className="text-2xl font-bold">Resumen de Cambios</h3>
                        <p className="text-muted-foreground">Has revisado el perfil detallado. ¿Deseas guardar todos los cambios?</p>
                        <div className="p-4 bg-muted/30 rounded-lg text-left text-sm max-h-[300px] overflow-y-auto">
                            <pre>{JSON.stringify(formData, null, 2)}</pre>
                        </div>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-6 text-lg font-bold bg-primary text-white rounded-xl shadow-lg">
                            {isSubmitting ? "Guardando..." : contactId ? "Actualizar Expediente" : "Crear Expediente"}
                        </Button>
                    </div>
                )
            case 6:
                return (
                    <div className="text-center animate-pop-in py-12">
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <CheckIcon className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">¡Operación Exitosa!</h3>
                        <p className="text-muted-foreground mb-8">El expediente de {formData.contactName || formData.businessName} ha sido procesado correctamente.</p>
                        <Button onClick={onBack || onCancel} className="w-full py-6 text-lg font-bold bg-primary text-white rounded-xl shadow-lg">
                            Continuar
                        </Button>
                    </div>
                )
            default:
                return null
        }
    }

    const Icon = sectionIcons[currentStep]

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {Icon && <Icon className="w-6 h-6 text-primary" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Gestión de Expediente</h2>
                        <p className="text-muted-foreground">Paso {currentStep} de {steps.length - 1}: {steps[currentStep - 1].title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <HomeIcon className="w-6 h-6" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <XIcon className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex justify-between gap-2">
                    {steps.filter(s => s.id < 6).map(step => (
                        <div key={step.id} className={cn(
                            "h-2 flex-1 rounded-full transition-all duration-300",
                            currentStep === step.id ? "bg-primary" : (currentStep > step.id ? "bg-green-500" : "bg-muted")
                        )} />
                    ))}
                </div>
            </div>

            <div className={cn("bg-card border rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]", animation)}>
                {renderStep()}
            </div>

            {currentStep < 5 && (
                <div className="flex justify-between items-center mt-8 gap-4">
                    <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1} className="py-6 px-8 rounded-xl flex-1 md:flex-none">
                        Anterior
                    </Button>
                    <Button onClick={handleNext} className="py-6 px-8 rounded-xl bg-primary text-white flex-1 md:flex-none">
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    )
}
