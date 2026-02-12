"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Clock, User, Home } from "lucide-react"
import { UniversalContactForm } from "../shared/universal-contact-form"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export function RecorridosLayout({ leadId }: { leadId?: string }) {
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)
  const [activeLead, setActiveLead] = useState<string | null>(null)

  useEffect(() => {
    if (leadId) {
      setActiveLead(leadId)
      setShowNewLeadForm(true)
    }
  }, [leadId])

  // Mock data for recent leads
  const recentLeads = [
    {
      id: "1",
      businessName: "Restaurante El Buen Sabor",
      contactName: "María González",
      createdAt: "2024-01-15T10:30:00Z",
      status: "active",
    },
    {
      id: "2",
      businessName: "Ferretería Los Hermanos",
      contactName: "Carlos Mendoza",
      createdAt: "2024-01-14T15:45:00Z",
      status: "completed",
    },
  ]

  const handleNewLead = () => {
    setShowNewLeadForm(true)
    setActiveLead(null)
  }

  const handleSelectLead = (leadId: string) => {
    setActiveLead(leadId)
    setShowNewLeadForm(true)
  }

  const handleBack = () => {
    setShowNewLeadForm(false)
    setActiveLead(null)
    // a back should redirect to the leads page
    window.location.href = '/leads'
  }

  if (showNewLeadForm || activeLead) {
    return (
      <UniversalContactForm
        contactId={activeLead}
        mode="lead"
        onBack={handleBack}
        onCancel={handleBack}
        onSave={() => {
          // Optionally handle post-save logic
        }}
      />
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Recorridos de Campo</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Captura de información en campo</p>
          </div>
          <Button onClick={handleNewLead} size="lg" className="w-full sm:w-auto shadow-lg">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Lead
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
            <CardDescription>Continúa una captura en progreso o revisa un lead completado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-2 sm:px-6">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleSelectLead(lead.id)}
              >
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <div className="w-10 h-10 min-w-[40px] bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-medium text-foreground truncate">{lead.businessName}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{lead.contactName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="hidden xs:inline text-[10px] sm:text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                  </span>
                  <Button variant="outline" size="sm" className="h-8 text-xs px-2 sm:px-3">
                    Continuar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Hoy</CardTitle>
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Semana</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Conversión</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">68%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}