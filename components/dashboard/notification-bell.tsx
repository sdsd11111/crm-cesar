'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
    const [count, setCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetchCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchCount = async () => {
        try {
            const res = await fetch('/api/donna/missions/count');
            const data = await res.json();
            setCount(data.count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => router.push('/donna')}
        >
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
                >
                    {count > 9 ? '9+' : count}
                </Badge>
            )}
        </Button>
    );
}
