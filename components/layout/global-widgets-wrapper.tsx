"use client"

import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { CalendarBookingButton } from "@/components/shared/CalendarBookingButton"

// Lazy load heavy components
const AIChatDrawer = dynamic(() => import("@/components/ai/ai-chat-drawer").then(mod => mod.AIChatDrawer), {
    ssr: false,
})

export function GlobalWidgetsWrapper() {
    const pathname = usePathname()

    // Define public routes where widgets should NOT appear
    const publicRoutes = ["/carnaval-2026", "/auth/login", "/public"]

    // Check if current route starts with any of the public routes
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))

    if (isPublicRoute) {
        return null
    }

    return (
        <>
            <AIChatDrawer />
            <CalendarBookingButton />
        </>
    )
}
