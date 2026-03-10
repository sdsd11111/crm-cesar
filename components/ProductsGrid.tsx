
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    benefits: string | null;
    category: string | null;
    paymentForm: string | null;
    servicesIncluded: string | null;
}

interface ProductsGridProps {
    groupedProducts: Record<string, Product[]>;
}

export default function ProductsGrid({ groupedProducts }: ProductsGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Object.keys(groupedProducts);

    return (
        <div className="space-y-12">
            {/* Category Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <Dialog key={category} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                        <DialogTrigger asChild>
                            <button className="group relative overflow-hidden rounded-2xl glass-card p-8 text-left transition-all hover:scale-[1.02] hover:shadow-elevated min-h-[200px] flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{category}</h3>
                                    <p className="text-slate-400 text-sm">
                                        {groupedProducts[category].length} Soluciones disponibles
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mt-4">
                                    <span>Ver Servicios</span>
                                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 border-0 bg-transparent shadow-none overflow-hidden">
                            <div className="h-full w-full glass-strong rounded-3xl flex flex-col overflow-hidden relative border border-white/20 shadow-2xl">
                                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-3xl shrink-0">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white tracking-tight">{category}</h2>
                                        <p className="text-slate-400 mt-1">Selecciona la solución ideal para tu objetivo</p>
                                    </div>
                                    {/* Close button handled by Dialog primitive, but we can add custom if needed */}
                                </div>

                                <ScrollArea className="flex-1 p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                                        {groupedProducts[category].map((product) => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
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

function ProductCard({ product }: { product: Product }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const description = product.description || '';
    const shouldTruncate = description.length > 120; // Truncate after ~120 chars

    return (
        <div className="glass bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-blue-500/30 transition-colors">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white leading-snug">{product.name}</h3>
            </div>

            <div className="mb-6 flex-grow">
                <div className={`text-slate-300 text-sm leading-relaxed whitespace-pre-line ${!isExpanded && shouldTruncate ? 'line-clamp-3' : ''}`}>
                    {description}
                </div>
                {shouldTruncate && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="text-blue-400 text-xs font-medium mt-2 hover:underline focus:outline-none"
                    >
                        {isExpanded ? 'Leer menos' : 'Leer más...'}
                    </button>
                )}
            </div>

            {product.servicesIncluded && (
                <div className="mb-6 bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-2 tracking-wider">Incluye:</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{product.servicesIncluded}</p>
                </div>
            )}

            <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Inversión</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">${product.price}</span>
                        {product.paymentForm && <span className="text-xs text-slate-400">/ {product.paymentForm}</span>}
                    </div>
                </div>

                <a
                    href={`https://wa.me/593991234567?text=Hola, me interesa: ${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-900/40"
                >
                    Solicitar
                </a>
            </div>
        </div>
    );
}
