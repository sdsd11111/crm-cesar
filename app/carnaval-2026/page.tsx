'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, MessageSquare, User, CheckCircle2, ArrowRight, ChevronRight, Share2, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Steps definition updated with user requests
const STEPS = [
    {
        id: 'name',
        title: '¿Cómo te llamas?',
        description: 'Queremos conocerte.',
        icon: <User className="w-6 h-6" />,
        placeholder: 'Tu nombre completo',
        field: 'fullName',
        type: 'text'
    },
    {
        id: 'phone',
        title: '¿Cuál es tu número de WhatsApp?',
        description: 'Para enviarte tu recompensa.',
        icon: <Phone className="w-6 h-6" />,
        placeholder: 'Ej: 0991234567',
        field: 'phone',
        type: 'tel'
    },
    {
        id: 'location',
        title: '¿De dónde eres?',
        description: 'Déjanos saber desde donde nos visitas.',
        icon: <MapPin className="w-6 h-6" />,
        placeholder: 'Ciudad / Ubicación',
        field: 'location',
        type: 'text'
    },
    {
        id: 'source',
        title: '¿Cómo nos conocistes?',
        description: 'Ayúdanos a saber cómo llegaste aquí.',
        icon: <Share2 className="w-6 h-6" />,
        placeholder: 'Selecciona una opción',
        field: 'referralSource',
        type: 'select',
        options: ['Redes Sociales', 'Sitio Web', 'Otros', 'Opción 5']
    },
    {
        id: 'birthday',
        title: 'Dinos la fecha de tu cumpleaños',
        description: 'Nos encantaría enviarte algún presente.',
        icon: <Calendar className="w-6 h-6" />,
        placeholder: 'Fecha de nacimiento',
        field: 'birthDate',
        type: 'date'
    },
    {
        id: 'suggestions',
        title: '¿Nos puedes hacer una sugerencia?',
        description: 'Es muy valioso para mejorar la forma en que servimos.',
        icon: <MessageSquare className="w-6 h-6" />,
        placeholder: 'Tus sugerencias aquí...',
        field: 'suggestions',
        type: 'textarea'
    },
    {
        id: 'final',
        title: '¡Casi Listo!',
        description: 'IMPORTANTE: Debes registrar este número en tu teléfono para recibir tu recompensa por WhatsApp.',
        icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
        isLast: true
    }
];

export default function LeadCaptureDemo() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<any>({
        id: '',
        fullName: '',
        phone: '',
        location: '',
        referralSource: '',
        birthDate: '',
        suggestions: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress((step / (STEPS.length - 1)) * 100);
    }, [step]);

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            // Partial save
            await saveProgress();
            setStep(prev => prev + 1);
        }
    };

    const saveProgress = async (final = false) => {
        try {
            setIsSubmitting(true);
            const res = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    ...formData,
                    currentStep: step + 1,
                    status: final ? 'completed' : 'incomplete'
                })
            });
            const data = await res.json();
            if (data.success && data.lead) {
                setFormData((prev: any) => ({ ...prev, id: data.lead.id }));
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            // toast.error("Hubo un error guardando tu progreso");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentStepData = STEPS[step];

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{ backgroundImage: "url('/carnaval-hero.jpg')" }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">

                {/* Header / Logo Area */}
                <div className="mb-8 text-center animate-in fade-in slide-in-from-top duration-700">
                    <h2 className="text-white/80 text-sm font-medium tracking-widest uppercase mb-2">Experiencia Premium</h2>
                    <h1 className="text-white text-4xl font-bold tracking-tight">OBJETIVO <span className="text-yellow-400">CRM</span></h1>
                </div>

                {/* Card / Form Area */}
                <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">

                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="space-y-8 min-h-[300px] flex flex-col justify-center">
                        {/* Icon & Title */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white ring-1 ring-white/20">
                                {currentStepData.icon}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-white leading-tight">
                                    {currentStepData.title}
                                </h3>
                                <p className="text-white/60 text-lg leading-relaxed">
                                    {currentStepData.description}
                                </p>
                            </div>
                        </div>

                        {/* Input Area */}
                        {!currentStepData.isLast && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
                                {currentStepData.type === 'textarea' ? (
                                    <Textarea
                                        value={formData[currentStepData.field as string]}
                                        onChange={(e) => setFormData({ ...formData, [currentStepData.field!]: e.target.value })}
                                        placeholder={currentStepData.placeholder}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl px-6 py-4 focus:ring-yellow-400/50 min-h-[120px] text-lg"
                                    />
                                ) : currentStepData.type === 'select' ? (
                                    <Select
                                        onValueChange={(value) => setFormData({ ...formData, [currentStepData.field!]: value })}
                                        defaultValue={formData[currentStepData.field as string]}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-16 rounded-xl px-6 focus:ring-yellow-400/50 text-lg">
                                            <SelectValue placeholder={currentStepData.placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currentStepData.options?.map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        type={currentStepData.type}
                                        value={formData[currentStepData.field as string]}
                                        onChange={(e) => setFormData({ ...formData, [currentStepData.field!]: e.target.value })}
                                        placeholder={currentStepData.placeholder}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-16 rounded-xl px-6 focus:ring-yellow-400/50 text-lg"
                                        onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                                    />
                                )}

                                <Button
                                    onClick={handleNext}
                                    disabled={isSubmitting || (!!currentStepData.field && !formData[currentStepData.field as string])}
                                    className="w-full h-16 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    Siguiente
                                    <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        )}

                        {/* Final Step Button */}
                        {currentStepData.isLast && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-700 delay-200 flex flex-col items-center text-center w-full">
                                <div className="bg-green-500/20 p-6 rounded-full border border-green-500/30 mb-2">
                                    {currentStepData.icon}
                                </div>

                                {/* Button 1: Save Contact (VCF) */}
                                <a
                                    href="/contacto_objetivo.vcf"
                                    download="Contacto_Objetivo_CRM.vcf"
                                    className="w-full"
                                >
                                    <Button
                                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 animate-pulse ring-2 ring-white/20 pointer-events-none"
                                    >
                                        📲 1. Guardar Contacto
                                    </Button>
                                </a>
                                <p className="text-white/60 text-xs mb-2">
                                    *Necesario para asegurar tu recompensa
                                </p>

                                {/* Button 2: WhatsApp */}
                                <Button
                                    onClick={() => window.location.href = 'https://wa.me/593963410409?text=' + encodeURIComponent(`¡Hola! Ya guardé su contacto (Objetivo CRM). Mi nombre es ${formData.fullName} y mi teléfono es ${formData.phone}. Quiero mi sorpresa.`)}
                                    className="w-full h-16 bg-green-500 hover:bg-green-400 text-white font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-3"
                                >
                                    💬 2. Ir a WhatsApp
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-white/30 text-sm flex flex-col gap-2">
                    <p>© 2026 Objetivo Marketing & CRM</p>
                    <p className="flex items-center justify-center gap-2">
                        Hecho con <span className="text-red-500/50">❤️</span> para el Carnaval de Loja
                    </p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-400/10 blur-[120px] rounded-full"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>
    );
}
