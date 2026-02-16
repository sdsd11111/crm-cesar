
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function ComunicacionesLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-8rem)] overflow-hidden">
                {children}
            </div>
        </DashboardLayout>
    );
}
