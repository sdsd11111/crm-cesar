'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * ⚠️ EXPLICACIÓN DEL FIX:
 * El problema de la multiplicación ocurría porque el intervalo seguía detectando el contenedor 
 * como "vacío" durante los milisegundos que tarda Google en inyectar su código.
 * 
 * SOLUCIÓN:
 * 1. Usamos una Ref (`hasAttemptedInit`) para bloquear cualquier intento duplicado en el componente.
 * 2. Usamos un flag global `window.__calendarInitialized` para bloquear duplicados entre re-renders de Next.js.
 * 3. Limpieza agresiva del DOM en el cleanup del efecto.
 */

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const hasAttemptedInit = useRef(false);

    const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp', '/discovery'];

    useEffect(() => {
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        setIsVisible(isAllowed);
    }, [pathname]);

    useEffect(() => {
        if (!isVisible) return;

        const initCalendar = () => {
            // Si ya estamos inicializando o ya se hizo globalmente, abortar.
            if (hasAttemptedInit.current || (window as any).__calendarInitialized) return;

            if (typeof window !== 'undefined' && (window as any).calendar && (window as any).calendar.schedulingButton) {
                const target = document.getElementById('calendar-booking-target');

                if (target) {
                    console.log('📅 [Calendar] Iniciando carga única...');
                    hasAttemptedInit.current = true;
                    (window as any).__calendarInitialized = true;

                    (window as any).calendar.schedulingButton.load({
                        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true',
                        color: '#039BE5',
                        label: 'AGENDAR CITA',
                        target,
                    });
                }
            }
        };

        // Un solo intento serio después de un breve delay para asegurar que el DOM esté listo
        const timer = setTimeout(initCalendar, 1500);

        return () => {
            clearTimeout(timer);
            hasAttemptedInit.current = false;
            (window as any).__calendarInitialized = false;
            const target = document.getElementById('calendar-booking-target');
            if (target) target.innerHTML = '';
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="afterInteractive"
            />

            <div
                id="calendar-booking-target"
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[99999]"
            />

            <style jsx global>{`
                /* FORZAR POSICIÓN LATERAL Y EVITAR QUE SE VAYA AL FONDO */
                #calendar-booking-target {
                    position: fixed !important;
                    right: 0 !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    width: auto !important;
                    height: auto !important;
                }

                #calendar-booking-target button {
                    all: unset !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    writing-mode: vertical-rl !important;
                    text-orientation: mixed !important;
                    background-color: #039BE5 !important;
                    color: white !important;
                    padding: 35px 12px !important;
                    border-radius: 20px 0 0 20px !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.2em !important;
                    text-transform: uppercase !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: -5px 0 25px rgba(0,0,0,0.4) !important;
                    border: 1px solid rgba(255,255,255,0.3) !important;
                    border-right: none !important;
                    font-size: 12px !important;
                    line-height: 1 !important;
                    height: 180px !important;
                    z-index: 100000 !important;
                }

                #calendar-booking-target button:hover {
                    background-color: #0288d1 !important;
                    padding-right: 25px !important;
                    box-shadow: -8px 0 30px rgba(3,155,229,0.6) !important;
                }

                /* ESCONDER CUALQUIER OTRO BOTÓN QUE GOOGLE INTENTE METER POR ERROR */
                #calendar-booking-target button ~ button {
                    display: none !important;
                }
            `}</style>
        </>
    );
}
