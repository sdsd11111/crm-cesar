'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

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

        let isInitialized = false;

        const initCalendar = () => {
            if (isInitialized) return;

            if (typeof window !== 'undefined' && (window as any).calendar && (window as any).calendar.schedulingButton) {
                const target = document.getElementById('calendar-booking-container');

                // Extra check: only if it exists and is empty
                if (target && target.children.length === 0) {
                    console.log('📅 [CalendarBookingButton] Initializing...');
                    isInitialized = true;
                    (window as any).calendar.schedulingButton.load({
                        url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true',
                        color: '#039BE5',
                        label: 'Programar una cita',
                        target,
                    });
                }
            }
        };

        // Check every 500ms, but the flag prevents double work
        const timer = setInterval(() => {
            if (isInitialized) {
                clearInterval(timer);
                return;
            }
            initCalendar();
        }, 500);

        return () => {
            clearInterval(timer);
            const target = document.getElementById('calendar-booking-container');
            if (target) target.innerHTML = '';
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <link
                href="https://calendar.google.com/calendar/scheduling-button-script.css"
                rel="stylesheet"
            />
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="afterInteractive"
            />
            <div
                id="calendar-booking-container"
                className="fixed bottom-6 right-6 z-[10000]"
                style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, minWidth: '150px', minHeight: '40px' }}
            />
        </>
    );
}
