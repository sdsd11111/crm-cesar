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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Recorridos de Campo</h2>
            <p className="text-muted-foreground">Captura información de leads durante tus visitas comerciales</p>
          </div>
          <Button onClick={handleNewLead} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Lead
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
            <CardDescription>Continúa una captura en progreso o revisa un lead completado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => handleSelectLead(lead.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{lead.businessName}</h4>
                    <p className="text-sm text-muted-foreground">{lead.contactName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("es-ES")}
                  </span>
                  <Button variant="outline" size="sm">
                    Continuar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Hoy</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}