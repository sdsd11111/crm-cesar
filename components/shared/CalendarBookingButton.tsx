'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Calendar } from 'lucide-react';

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    // Show only on specific pages
    const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp', '/discovery'];

    useEffect(() => {
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        setIsVisible(isAllowed);
    }, [pathname]);

    useEffect(() => {
        if (!isVisible) return;

        const initCalendar = () => {
            if (typeof window !== 'undefined' && (window as any).calendar && (window as any).calendar.schedulingButton) {
                const target = document.getElementById('google-calendar-hidden-target');
                if (target && target.children.length === 0) {
                    (window as any).calendar.schedulingButton.load({
                        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true',
                        color: '#039BE5',
                        label: 'Programar una cita',
                        target,
                    });
                }
            }
        };

        const timer = setInterval(initCalendar, 1000);
        return () => clearInterval(timer);
    }, [isVisible]);

    const handleOpenCalendar = () => {
        // Trigger the hidden Google button
        const googleBtn = document.querySelector('#google-calendar-hidden-target button');
        if (googleBtn) {
            (googleBtn as HTMLElement).click();
        } else {
            console.warn('📅 [CalendarBookingButton] Google button not ready yet.');
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="afterInteractive"
            />

            {/* Hidden container for Google to inject its button */}
            <div id="google-calendar-hidden-target" className="hidden pointer-events-none opacity-0 invisible h-0 w-0 overflow-hidden" />

            {/* Premium Vertical Side Tab */}
            <button
                onClick={handleOpenCalendar}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[99999] flex items-center gap-3 px-2 py-8 bg-[#039BE5] hover:bg-[#0288d1] text-white rounded-l-2xl shadow-[-4px_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:pr-4 group border-y border-l border-white/20 active:scale-95"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
                <div className="flex flex-col items-center gap-3 rotate-180">
                    <Calendar className="h-5 w-5 -rotate-90 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Agendar Cita</span>
                </div>
            </button>
        </>
    );
}
