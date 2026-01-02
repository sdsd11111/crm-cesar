'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    // Show only on specific pages
    const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp'];

    useEffect(() => {
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        setIsVisible(isAllowed);
    }, [pathname]);

    if (!isVisible) return null;

    return (
        <>
            {/* Google Calendar CSS */}
            <link
                href="https://calendar.google.com/calendar/scheduling-button-script.css"
                rel="stylesheet"
            />

            {/* Google Calendar Script */}
            <Script
                src="https://calendar.google.com/calendar/scheduling-button-script.js"
                strategy="lazyOnload"
                onLoad={() => {
                    // This part is handled by the window load event or manual trigger if needed
                    // But the provided snippet uses a self-executing function
                }}
            />

            {/* Custom Floating Button to trigger the Google Script logic if needed, 
                but Google's script usually looks for a specific element or provides a window object.
                The user's script uses: calendar.schedulingButton.load({...})
            */}

            <div
                id="calendar-booking-target"
                className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
                {/* The Google script will inject the button here or we can trigger it */}
                <script dangerouslySetInnerHTML={{
                    __html: `
                        window.addEventListener('load', function() {
                            if (window.calendar && window.calendar.schedulingButton) {
                                window.calendar.schedulingButton.load({
                                    url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true',
                                    color: '#039BE5',
                                    label: 'Programar una cita',
                                    target: document.getElementById('calendar-booking-target'),
                                });
                            }
                        });
                    `
                }} />
            </div>

            {/* In case window load already happened or for SPA navigation, re-run logic */}
            <CalendarInit url="https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true" />
        </>
    );
}

function CalendarInit({ url }: { url: string }) {
    useEffect(() => {
        const init = () => {
            if (typeof window !== 'undefined' && (window as any).calendar && (window as any).calendar.schedulingButton) {
                const target = document.getElementById('calendar-booking-target');
                if (target && target.innerHTML === '') {
                    (window as any).calendar.schedulingButton.load({
                        url,
                        color: '#039BE5',
                        label: 'Programar una cita',
                        target,
                    });
                }
            }
        };

        // Try immediately
        init();

        // Also listen for script load
        window.addEventListener('calendar-script-loaded', init);
        return () => window.removeEventListener('calendar-script-loaded', init);
    }, [url]);

    return null;
}
