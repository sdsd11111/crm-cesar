'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Calendar } from 'lucide-react';

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const hasInitialized = useRef(false);

    const calendarUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true';

    // Show only on specific pages
    useEffect(() => {
        const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp', '/discovery'];
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        console.log('📅 [Calendar] Page:', pathname, 'Visible:', isAllowed);
        setIsVisible(isAllowed);
    }, [pathname]);

    // Initialize Google Script functionality
    useEffect(() => {
        if (!isVisible || hasInitialized.current) return;

        const init = () => {
            if (hasInitialized.current) return;

            if (typeof window !== 'undefined' && (window as any).calendar?.schedulingButton) {
                const target = document.getElementById('google-popup-hidden-v2');
                if (target) {
                    console.log('📅 [Calendar] Injecting hidden Google trigger...');
                    (window as any).calendar.schedulingButton.load({
                        url: calendarUrl,
                        target,
                        label: 'TRIGGER', // Needed for Google to create the element
                    });
                    hasInitialized.current = true;
                }
            }
        };

        const timer = setInterval(init, 1000);
        return () => clearInterval(timer);
    }, [isVisible]);

    const handleOpenCalendar = () => {
        // Try to trigger the official Google Modal (the best experience)
        const googleBtn = document.querySelector('#google-popup-hidden-v2 button');

        if (googleBtn) {
            console.log('📅 [Calendar] Triggering Google Modal overlay');
            (googleBtn as HTMLElement).click();
        } else {
            // Fallback: Centered Popup Window (not a new tab)
            console.log('📅 [Calendar] Fallback to Window Popup');
            const width = 850;
            const height = 750;
            const left = (window.innerWidth / 2) - (width / 2);
            const top = (window.innerHeight / 2) - (height / 2);

            window.open(
                calendarUrl,
                'ReservaObjetivo',
                `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
            );
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Load official Google CSS & Script */}
            <link href="https://calendar.google.com/calendar/scheduling-button-script.css" rel="stylesheet" />
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="afterInteractive"
            />

            {/* Hidden target that will contain the Google logic */}
            <div
                id="google-popup-hidden-v2"
                className="fixed -left-[2000px] pointer-events-none opacity-0 invisible overflow-hidden h-0 w-0"
            />

            {/* Premium Side Tab Button */}
            <button
                id="main-calendar-side-tab"
                onClick={handleOpenCalendar}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[999999] flex items-center justify-center bg-[#039BE5] hover:bg-[#0288d1] text-white py-10 px-3 rounded-l-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.5)] border-y border-l border-white/40 group active:scale-95 transition-all"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
                <div className="flex flex-col items-center gap-4 rotate-180">
                    <Calendar className="h-6 w-6 -rotate-90 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                        Agendar Cita
                    </span>
                </div>
            </button>
        </>
    );
}
