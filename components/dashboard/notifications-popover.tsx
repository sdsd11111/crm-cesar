"use client"

import { useState, useEffect } from "react"
import { Bell, UserPlus, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function NotificationsPopover() {
    const router = useRouter()
    const [newLeadsCount, setNewLeadsCount] = useState(0)
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
    const [open, setOpen] = useState(false)

    const checkNotifications = async () => {
        // Check Leads
        try {
            const res = await fetch("/api/leads/count-new")
            if (res.ok) {
                const { count } = await res.json()
                setNewLeadsCount(count)
            }
        } catch (e) { console.error(e) }

        // Check WhatsApp
        try {
            const res = await fetch("/api/whatsapp/unread")
            if (res.ok) {
                const { count } = await res.json()
                setUnreadMessagesCount(count)
            }
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        checkNotifications()
        const interval = setInterval(checkNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const total = newLeadsCount + unreadMessagesCount

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative overflow-visible px-2 w-auto" aria-label="Notificaciones">
                    <Bell className="h-5 w-5" />
                    {total > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-[1.25rem] rounded-full p-0 flex items-center justify-center bg-red-500 text-[10px] ring-2 ring-background text-white font-bold shadow-sm">
                            {total}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 mr-4" align="end">
                <div className="p-3 border-b text-sm font-semibold bg-muted/50">Notificaciones</div>
                <div className="grid gap-0 p-1">
                    <Button
                        variant="ghost"
                        className="justify-start gap-3 h-auto py-3 px-3 relative"
                        onClick={() => { router.push('/leads'); setOpen(false); }}
                    >
                        <div className="relative p-2 bg-blue-500/10 rounded-full text-blue-500">
                            <UserPlus className="h-4 w-4" />
                            {newLeadsCount > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-blue-500 border-2 border-background rounded-full" />}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm font-medium">Nuevos Leads</span>
                            <span className="text-xs text-muted-foreground">
                                {newLeadsCount === 0 ? "No hay leads pendientes" : `${newLeadsCount} leads por revisar`}
                            </span>
                        </div>
                    </Button>

                    <Button
                        variant="ghost"
                        className="justify-start gap-3 h-auto py-3 px-3 relative"
                        onClick={() => { router.push('/whatsapp'); setOpen(false); }}
                    >
                        <div className="relative p-2 bg-green-500/10 rounded-full text-green-500">
                            <MessageSquare className="h-4 w-4" />
                            {unreadMessagesCount > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-background rounded-full" />}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm font-medium">WhatsApp</span>
                            <span className="text-xs text-muted-foreground">
                                {unreadMessagesCount === 0 ? "Bandeja al día" : `${unreadMessagesCount} mensajes no leídos`}
                            </span>
                        </div>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
