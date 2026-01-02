'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, ChevronLeft } from 'lucide-react';

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const calendarUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true';

    // Show only on specific pages
    useEffect(() => {
        const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp', '/discovery'];
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        setIsVisible(isAllowed);
    }, [pathname]);

    const handleOpenCalendar = () => {
        // Opción 1: Abrir en pestaña nueva (la más fiable del mundo)
        window.open(calendarUrl, '_blank');

        // Opción 2: Intentar disparar el modal de Google si el script cargó por debajo
        try {
            const googleBtn = document.querySelector('#google-hidden-trigger button');
            if (googleBtn) (googleBtn as HTMLElement).click();
        } catch (e) {
            console.warn("Google modal trigger failed, fallback to new tab used.");
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Carga silenciosa del script de Google por si acaso funciona el modal */}
            <script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                async
                onLoad={() => {
                    if ((window as any).calendar?.schedulingButton) {
                        (window as any).calendar.schedulingButton.load({
                            url: calendarUrl,
                            color: '#039BE5',
                            label: 'Cita',
                            target: document.getElementById('google-hidden-trigger'),
                        });
                    }
                }}
            />
            <div id="google-hidden-trigger" className="hidden pointer-events-none opacity-0" />

            {/* PESTAÑA LATERAL 100% REACT (VISIBLE SIEMPRE) */}
            <div
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[999999] flex items-center transition-all duration-300"
                style={{ transform: `translateY(-50%) translateX(${isHovered ? '0' : '5px'})` }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <button
                    onClick={handleOpenCalendar}
                    className="flex items-center gap-3 bg-[#039BE5] hover:bg-[#0288d1] text-white py-8 px-3 rounded-l-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.5)] border-y border-l border-white/30 group active:scale-95 transition-all"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    <div className="flex flex-col items-center gap-4 rotate-180">
                        <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/40 transition-colors">
                            <Calendar className="h-5 w-5 -rotate-90" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                            Agendar Cita
                        </span>
                    </div>
                </button>

                {/* Indicador de flecha */}
                <div className={`absolute left-0 -ml-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <ChevronLeft className="h-6 w-6 text-[#039BE5] animate-pulse" />
                </div>
            </div>
        </>
    );
}
