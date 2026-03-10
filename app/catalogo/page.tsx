
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Metadata } from 'next';
import PortfolioHero from '@/components/PortfolioHero';

export const metadata: Metadata = {
    title: 'Catálogo de Servicios 2026 | CRM Objetivo',
    description: 'Explora nuestros servicios de consultoría, diseño web, y posicionamiento.',
};

export default async function CatalogoPage() {
    // DB Fetching removed to fix build error (PortfolioHero uses static data)
    // const allProducts = await db.select().from(products).orderBy(desc(products.price));
    // const grouped: Record<string, typeof allProducts> = {};...

    return (
        <div className="min-h-screen font-sans relative overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
            {/* Background Image & Overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/60 z-10" /> {/* Overlay for text readability */}
                <img
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-80"
                />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto p-6 md:p-12">
                {/* Header */}
                <div className="mb-16 md:mb-24 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">Catálogo 2026</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        Transformamos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Ideas en Resultados.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
                        Selecciona una categoría para explorar nuestras soluciones estratégicas diseñadas para el crecimiento de tu negocio.
                    </p>
                </div>

                {/* Portfolio Hero with 3 Pillars */}
                <PortfolioHero />

                <div className="mt-24 pt-8 border-t border-white/5 text-center text-slate-600 text-sm">
                    <p>© 2026 Grupo Empresarial Reyes. Innovación Estratégica.</p>
                </div>
            </div>
        </div>
    );
}
