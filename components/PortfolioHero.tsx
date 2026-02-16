'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BrainCircuit,
    MonitorSmartphone,
    Rocket,
    ArrowRight,
    ExternalLink,
    X,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Real Service Data from cesarreyesjaramillo.com
const SERVICES_DATA = {
    estrategia: {
        id: 'estrategia',
        title: 'Análisis Estratégico',
        description: 'Auditoría, Consultoría y Planificación de Negocio.',
        icon: BrainCircuit,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
        pageUrl: 'https://www.cesarreyesjaramillo.com/analisis-estrategico',
        services: [
            {
                title: 'Plan de Posicionamiento SEO y Estrategia de Contenidos',
                description: 'Conquista Google y Atrae Clientes Calificados, Incluso si Odias Escribir. El 93% de las experiencias online comienzan con un motor de búsqueda.',
                benefits: [
                    'Análisis Profundo de Palabras Clave',
                    'Lista Organizada y Estratégica de términos',
                    'Guía de Contenido y Estrategia de Artículos Pilares'
                ]
            },
            {
                title: 'Consultoría Empresarial (Inicio y Fundamentos)',
                description: 'Transforma tu Gran Idea en un Negocio Próspero con Bases Sólidas. Evita que tu idea se convierta en un hobby caro.',
                benefits: [
                    'Sesión de Descubrimiento y Análisis FODA',
                    'Define tu Propuesta de Valor Única (PVU)',
                    'Misión, Visión y Propósito de tu negocio',
                    'Estrategia de Marketing Digital con cálculo de ROI'
                ]
            },
            {
                title: 'Estudio de Factibilidad y Viabilidad',
                description: 'Valida tu Idea de Negocio Antes de Arriesgar Todo tu Patrimonio. Este estudio es tu seguro más valioso.',
                benefits: [
                    'Estudio Profundo de Mercado y Competencia',
                    'Investigación de Demanda Digital',
                    'Análisis Financiero con proyecciones a 3-5 años',
                    'Documento Profesional listo para bancos'
                ]
            },
            {
                title: 'Estrategia para Ganar Clientes',
                description: 'Plan de Marketing Probado que Convierte Visitantes en Ventas Reales. Esta estrategia completa te da la ventaja competitiva.',
                benefits: [
                    'Análisis Exhaustivo de Mercado y Competencia (FODA)',
                    'Diferenciación real',
                    'Plan Listo para Implementar',
                    'Maximiza tu ROI'
                ]
            },
            {
                title: 'Reingeniería y Automatización de Procesos',
                description: 'Multiplica tu Productividad: Deja de Perder Dinero en Procesos Lentos. Reduce costos operativos en un 20-30%.',
                benefits: [
                    'Mapeo Completo de tu Operación',
                    'Identificación de Cuellos de Botella',
                    'Diseño de Procesos Optimizados',
                    'Automatización estratégica con herramientas no-code'
                ]
            }
        ]
    },
    diseno: {
        id: 'diseno',
        title: 'Diseño Web',
        description: 'Experiencias digitales, UI/UX y Desarrollo a medida.',
        icon: MonitorSmartphone,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        pageUrl: 'https://www.cesarreyesjaramillo.com/desarrollo-web',
        services: [
            {
                title: 'Tarjeta Digital Simple',
                price: '$60 USD',
                description: 'Para artesanos e independientes que buscan networking sin complicaciones. Genera tu primer contacto digital profesional.',
                benefits: [
                    'Info de contacto básica (email, teléfono, WhatsApp)',
                    'Enlaces directos a redes sociales',
                    'Botón Guardar Contacto en móviles',
                    'Formulario de contacto directo',
                    'Dominio personalizado incluido'
                ]
            },
            {
                title: 'Tarjeta Digital Profesional',
                price: '$150 USD',
                description: 'Para pymes que necesitan impresionar desde el primer contacto. 75% de clientes juzgan tu credibilidad por tu presencia digital.',
                benefits: [
                    'Diseño minimalista profesional responsive',
                    'Información de contacto completa',
                    'Enlaces a todas tus redes sociales',
                    'Formulario optimizado para conversión',
                    'Dominio personalizado profesional'
                ]
            },
            {
                title: 'Primera Web Estática',
                price: '$250 USD',
                description: 'Para artesanos y pymes iniciando su posicionamiento digital. Esta web posiciona tu marca con diseño UX/UI intuitivo.',
                benefits: [
                    'Diseño UX/UI intuitivo',
                    'Secciones: Inicio, Servicios, Productos, Contacto',
                    'SEO básico optimizado',
                    'Dominio profesional propio incluido',
                    'Hosting premium primer año sin costo'
                ]
            },
            {
                title: 'Web Profesional',
                price: '$500 USD',
                description: 'Para profesionales independientes y pymes que buscan crecer. Un vendedor trabajando 24/7 sin pagar salario.',
                benefits: [
                    'Diseño Premium UX que convierte',
                    'Hasta 5 secciones personalizadas',
                    'Blog integrado para contenido y SEO',
                    'Galería de productos/servicios',
                    'SEO y Google Analytics inicial'
                ]
            },
            {
                title: 'Plataforma Empresarial',
                price: '$700 USD',
                description: 'Para pymes escalando operaciones. Plataforma robusta con chatbot IA que responde instantáneamente 24/7.',
                benefits: [
                    'Diseño Corporativo Premium escalable',
                    'Hasta 20 páginas estratégicas',
                    'Capacidad Multilingüe: Español e Inglés',
                    'Chatbot IA para respuesta automática 24/7',
                    'SEO Avanzado con keywords estratégicas'
                ]
            },
            {
                title: 'E-commerce / Tienda Online',
                price: '$950 USD',
                description: 'Tienda online completa para comenzar a vender productos físicos o digitales con sistema de pagos integrado.',
                benefits: [
                    'Carrito de compras optimizado',
                    'Integración de pagos (Tarjetas, PayPal)',
                    'Sistema de gestión de inventario',
                    'SEO para productos',
                    'Hosting y dominio primer año incluido'
                ]
            }
        ]
    },
    posicionamiento: {
        id: 'posicionamiento',
        title: 'Posicionamiento',
        description: 'Marketing Digital, SEO, SEM y Redes Sociales.',
        icon: Rocket,
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-400/20',
        pageUrl: 'https://www.cesarreyesjaramillo.com/posicionamiento',
        services: [
            {
                title: 'Auditoría SEO y Rediseño Web',
                price: 'Desde $1,250 USD',
                description: 'Para PYMEs con sitio web existente que no genera tráfico ni ventas. Analiza +200 factores técnicos y de contenido que Google evalúa.',
                benefits: [
                    'Auditoría completa de +200 factores SEO',
                    'Análisis de velocidad y Core Web Vitals',
                    'Investigación keywords con volumen real',
                    'Análisis competencia',
                    'Rediseño UX/UI para Conversión',
                    'Reportes mensuales con posiciones y tráfico'
                ]
            },
            {
                title: 'Alianza Exclusiva Cero Inversión',
                price: '$500/mes x 24 meses',
                description: 'Para artesanos y PYMEs que quieren vender online sin capital inicial. E-commerce completo, posicionado en Google, sin desembolsar NADA inicial.',
                benefits: [
                    'Inversión Inicial Cero',
                    'E-commerce Listo 30 Días (30 productos)',
                    'Posicionamiento Google Continuo',
                    'Propiedad Total 24 Meses',
                    'Exclusividad Sectorial',
                    '5 artículos blog mensuales optimizados',
                    '20 posts redes sociales mensual'
                ]
            }
        ]
    }
};

export default function PortfolioHero() {
    const pillars = Object.values(SERVICES_DATA);

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {pillars.map((pillar) => (
                    <Dialog key={pillar.id}>
                        <DialogTrigger asChild>
                            <div
                                className={cn(
                                    "group relative flex flex-col justify-between h-[450px] p-8 rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500",
                                    "backdrop-blur-xl shadow-2xl",
                                    "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:-translate-y-2 ring-1 ring-white/5"
                                )}
                            >
                                {/* Glass Reflection/Sheen */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                                {/* Icon & Top */}
                                <div className="relative z-10">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110",
                                        pillar.bg, pillar.border, "border"
                                    )}>
                                        <pillar.icon className={cn("w-8 h-8", pillar.color)} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                                        {pillar.title}
                                    </h2>
                                    <p className="text-slate-400 font-light text-lg">
                                        {pillar.description}
                                    </p>
                                </div>

                                {/* Bottom / CTA */}
                                <div className="relative z-10 pt-8 border-t border-white/5 mt-auto">
                                    <div className="flex items-center justify-between text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                                        <span>{pillar.services.length} Servicios</span>
                                        <div className="flex items-center gap-2">
                                            Explorar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogTrigger>

                        {/* MODAL CONTENT */}
                        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 border-0 bg-transparent shadow-none overflow-hidden duration-300">
                            <div className="h-full w-full rounded-3xl flex flex-col overflow-hidden relative border border-white/10 shadow-2xl bg-[#0f1115]/95 backdrop-blur-2xl">

                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-8 border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-xl border bg-white/5", pillar.border)}>
                                            <pillar.icon className={cn("w-6 h-6", pillar.color)} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{pillar.title}</h3>
                                            <p className="text-slate-400 text-sm">Catálogo de Servicios</p>
                                        </div>
                                    </div>
                                    <DialogTrigger asChild>
                                        <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </DialogTrigger>
                                </div>

                                {/* Scrollable Content */}
                                <ScrollArea className="flex-1 p-8">
                                    <div className="space-y-6 pb-12">
                                        {pillar.services.map((service, idx) => (
                                            <ServiceCard key={idx} service={service} accentColor={pillar.color} />
                                        ))}

                                        {/* Link to Full Page */}
                                        <div className="mt-12 pt-8 border-t border-white/10">
                                            <a
                                                href={pillar.pageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium transition-all group"
                                            >
                                                Ver Información Completa en cesarreyesjaramillo.com
                                                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    );
}

function ServiceCard({ service, accentColor }: { service: any, accentColor: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleWhatsAppClick = () => {
        const text = `Hola César, me interesa el servicio de *${service.title}* ${service.price ? `(${service.price})` : ''} que vi en tu portafolio.`;
        window.open(`https://wa.me/593999999999?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="group relative mb-6">
            {/* Stacked Cards Effect - Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-2xl translate-y-2 translate-x-1 blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600/30 to-slate-700/30 rounded-2xl translate-y-1 translate-x-0.5" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl">
                {/* Header with Title & Price */}
                <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 p-5 border-b border-white/5">
                    <div className="flex justify-between items-start gap-4">
                        <h4 className="text-base font-bold text-white leading-tight flex-1">
                            {service.title}
                        </h4>
                        {service.price && (
                            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono whitespace-nowrap backdrop-blur-sm">
                                {service.price}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-4">
                    {/* Description */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {service.description}
                    </p>

                    {/* Toggle Benefits Link */}
                    {service.benefits && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn("text-xs font-medium hover:underline transition-colors", accentColor)}
                        >
                            {isExpanded ? '▼ Ocultar detalles' : '▶ Ver qué incluye'}
                        </button>
                    )}

                    {/* Benefits - Expandable */}
                    {service.benefits && isExpanded && (
                        <div className="pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <ul className="space-y-2">
                                {service.benefits.map((benefit: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-slate-400 text-xs">
                                        <CheckCircle2 className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", accentColor)} />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={handleWhatsAppClick}
                        className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-4"
                    >
                        Cotizar Ahora <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
