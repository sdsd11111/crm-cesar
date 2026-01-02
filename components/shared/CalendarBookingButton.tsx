'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Calendar } from 'lucide-react';

/**
 * BRUTAL FEEDBACK:
 * Mi implementación anterior falló porque intenté "hackear" el renderizado de Google.
 * 1. Google no renderiza en elementos con 'display: none' o 'visibility: hidden'.
 * 2. Simular un click en un botón inexistente es una estrategia de novato.
 * 3. La dependencia de timeouts para scripts externos es frágil.
 */

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
                const target = document.getElementById('calendar-booking-target');
                if (target && target.innerHTML === '') {
                    console.log('📅 [CalendarBookingButton] Intentando carga real...');
                    (window as any).calendar.schedulingButton.load({
                        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true',
                        color: '#039BE5',
                        label: '📅 AGENDAR CITA',
                        target,
                    });
                }
            }
        };

        const timer = setInterval(initCalendar, 1000);
        return () => clearInterval(timer);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <link href="https://calendar.google.com/calendar/scheduling-button-script.css" rel="stylesheet" />
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="afterInteractive"
            />

            {/* 
                CONTENEDOR DE LA PESTAÑA LATERAL 
                En lugar de esconderlo, estilizamos el contenedor para que 
                el botón de Google se vea como una pestaña lateral.
            */}
            <div
                id="calendar-booking-target"
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[99999]"
            />

            <style jsx global>{`
                #calendar-booking-target button {
                    all: unset !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    writing-mode: vertical-rl !important;
                    text-orientation: mixed !important;
                    background-color: #039BE5 !important;
                    color: white !important;
                    padding: 30px 10px !important;
                    border-radius: 16px 0 0 16px !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.15em !important;
                    text-transform: uppercase !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    box-shadow: -4px 0 20px rgba(0,0,0,0.3) !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                    font-size: 11px !important;
                    height: 160px !important;
                }
                #calendar-booking-target button:hover {
                    background-color: #0288d1 !important;
                    padding-right: 20px !important;
                    box-shadow: -6px 0 25px rgba(3,155,229,0.5) !important;
                }
                #calendar-booking-target button:active {
                    scale: 0.95;
                }
            `}</style>
        </>
    );
}
