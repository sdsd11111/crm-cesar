import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { GlobalWidgetsWrapper } from "@/components/layout/global-widgets-wrapper"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "CRM OBJETIVO",
  description: "Sistema de gestión inteligente de eventos y tareas",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CRM OBJETIVO",
  },
}

export const viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${poppins.variable} antialiased`} suppressHydrationWarning>
      <body className="font-poppins bg-background text-foreground" suppressHydrationWarning>
        {children}
        <GlobalWidgetsWrapper />
        <Toaster />
      </body>
    </html>
  )
}
