'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
    LayoutGrid,
    TrendingUp,
    Palette,
    Code2,
    Megaphone,
    BarChart3,
    Globe,
    Cpu,
    Layers,
    Phone,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { products } from '@/lib/db/schema';
import { InferSelectModel } from 'drizzle-orm';

type Product = InferSelectModel<typeof products>;

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
    'Estrategia': TrendingUp,
    'Diseño': Palette,
    'Desarrollo': Code2,
    'Marketing': Megaphone,
    'Analítica': BarChart3,
    'Web': Globe,
    'Tecnología': Cpu,
    'Otros': Layers,
    'Contacto': Phone,
};

interface CatalogTabsProps {
    groupedProducts: Record<string, Product[]>;
}

export default function CatalogTabs({ groupedProducts }: CatalogTabsProps) {
    const categories = Object.keys(groupedProducts);
    // Ensure "Otros" is last if present
    const sortedCategories = categories.sort((a, b) => {
        if (a === 'Otros') return 1;
        if (b === 'Otros') return -1;
        return a.localeCompare(b);
    });

    const [activeTab, setActiveTab] = useState(sortedCategories[0] || 'all');

    return (
        <TabsPrimitive.Root
            defaultValue={sortedCategories[0]}
            onValueChange={setActiveTab}
            className="w-full space-y-12"
        >
            {/* Scrollable Tab List */}
            <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                <TabsPrimitive.List className="flex gap-3 min-w-max px-2">
                    {sortedCategories.map((category) => {
                        const Icon = CATEGORY_ICONS[category.split(' ')[0]] || LayoutGrid;
                        const isActive = activeTab === category;

                        return (
                            <TabsPrimitive.Trigger
                                key={category}
                                value={category}
                                className={cn(
                                    "group flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md select-none",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                                    isActive
                                        ? "bg-white/15 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]"
                                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10"
                                )}
                            >
                                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-300")} />
                                {category}
                            </TabsPrimitive.Trigger>
                        );
                    })}
                </TabsPrimitive.List>
            </div>

            {/* Content Grid */}
            <div className="min-h-[500px]">
                {sortedCategories.map((category) => (
                    <TabsPrimitive.Content
                        key={category}
                        value={category}
                        className="animate-fade-in focus:outline-none"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedProducts[category].map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </TabsPrimitive.Content>
                ))}
            </div>
        </TabsPrimitive.Root>
    );
}

function ProductCard({ product }: { product: Product }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const description = product.description || '';
    const shouldTruncate = description.length > 140;

    const handleWhatsAppClick = () => {
        const text = `Hola, me interesa más información sobre el servicio: *${product.title}*`;
        window.open(`https://wa.me/593999999999?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="group relative flex flex-col p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1">
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="relative mb-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                        <Layers className="w-6 h-6 text-blue-400" />
                    </div>
                    {product.price && (
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
                            ${Number(product.price).toFixed(2)}
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors">
                    {product.title}
                </h3>
            </div>

            {/* Description */}
            <div className="relative flex-grow mb-6">
                <div
                    className={cn(
                        "text-slate-400 text-sm leading-relaxed whitespace-pre-line transition-all duration-300",
                        !isExpanded && shouldTruncate && "line-clamp-3 mask-image-b"
                    )}
                >
                    {description}
                </div>
                {shouldTruncate && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline focus:outline-none flex items-center gap-1"
                    >
                        {isExpanded ? 'Leer menos' : 'Leer más'}
                    </button>
                )}
            </div>

            {/* Footer / CTA */}
            <div className="relative mt-auto pt-4 border-t border-white/5">
                <button
                    onClick={handleWhatsAppClick}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 group/btn"
                >
                    Más Información
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
