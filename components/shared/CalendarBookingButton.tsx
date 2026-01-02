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
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[99999] transition-all duration-300 hover:mr-2"
                style={{
                    transform: 'translateY(-50%) rotate(-90deg)',
                    transformOrigin: 'right bottom',
                    marginBottom: '-100px', // Compensar la rotación
                    marginRight: '-10px'
                }}
            />

            <style jsx global>{`
                /* REGLAS BRUTALES PARA FORZAR EL DISEÑO DE GOOGLE */
                #calendar-booking-target button {
                    border-radius: 12px 12px 0 0 !important;
                    padding: 12px 24px !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.1em !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                    background-color: #039BE5 !important;
                    white-space: nowrap !important;
                }
                #calendar-booking-target button:hover {
                    background-color: #0288d1 !important;
                    padding-top: 16px !important;
                }
            `}</style>
        </>
    );
}
