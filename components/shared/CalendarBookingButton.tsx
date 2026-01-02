'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function CalendarBookingButton() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    // URL del agendamiento
    const calendarUrl = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ26I1xUXME05ewbX_aF1rah4KP__6M_4ggFuYF9PRDFS-QbZdI_ufh8igfJAKUopDDJ8iOl6W0b?gv=true";

    // Mostrar solo en páginas específicas
    useEffect(() => {
        const allowedPaths = ['/trainer', '/leads', '/clients', '/whatsapp', '/discovery'];
        const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
        setIsVisible(isAllowed);
    }, [pathname]);

    if (!isVisible) return null;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    id="main-calendar-side-tab"
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[40] flex items-center justify-center bg-[#039BE5] hover:bg-[#0288d1] text-white py-10 px-3 rounded-l-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.5)] border-y border-l border-white/40 group active:scale-95 transition-all"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    <div className="flex flex-col items-center gap-4 rotate-180">
                        <Calendar className="h-6 w-6 -rotate-90 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                            Agendar Cita
                        </span>
                    </div>
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="sm:max-w-[700px] w-full p-0 bg-white overflow-hidden border-l-4 border-[#039BE5]">
                <SheetHeader className="p-4 bg-[#039BE5] text-white">
                    <SheetTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Programar una Cita
                    </SheetTitle>
                </SheetHeader>

                <div className="w-full h-full relative">
                    {/* Google Calendar Appointment Scheduling begin */}
                    <iframe
                        src={calendarUrl}
                        style={{ border: 0, width: '100%', height: 'calc(100vh - 64px)' }}
                        frameBorder="0"
                    ></iframe>
                    {/* end Google Calendar Appointment Scheduling */}
                </div>
            </SheetContent>
        </Sheet>
    );
}
