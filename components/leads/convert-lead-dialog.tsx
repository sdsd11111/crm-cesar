"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react"
import { PlanType, ContractVariables } from "@/lib/templates/Contrato/types"
import { CONTRACT_VARIABLE_OPTS } from "@/lib/templates/Contrato/hotel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface ConvertLeadDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: ConversionDetails) => void
    leadName: string
    isConverting: boolean
    leadCity?: string // Added prop for pre-fill
}

export interface ConversionDetails {
    financials: {
        contractValue: number
        initialPayment: number
        balanceDueDate?: Date
    }
    contract?: {
        plan: PlanType
        variables: ContractVariables
    }
}

export function ConvertLeadDialog({ isOpen, onClose, onConfirm, leadName, isConverting, leadCity }: ConvertLeadDialogProps) {
    const [contractValue, setContractValue] = useState<string>("")
    const [initialPayment, setInitialPayment] = useState<string>("")
    const [balanceDueDate, setBalanceDueDate] = useState<Date | undefined>(new Date())

    // Contract State
    const [activeTab, setActiveTab] = useState("financials")
    const [plan, setPlan] = useState<PlanType>('PRO')
    const [variables, setVariables] = useState<Partial<ContractVariables>>({})

    useEffect(() => {
        if (isOpen) {
            // Pre-fill Defaults
            const today = new Date();
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

            setVariables(prev => ({
                ...prev,
                DIA_FIRMA: String(today.getDate()).padStart(2, '0'),
                MES_FIRMA: monthNames[today.getMonth()],
                ANIO_FIRMA: String(today.getFullYear()),
                NOMBRE_CONTRATANTE: leadName,
                // Default Contratista Data (Can be edited)
                NOMBRE_CONTRATISTA: 'César Reyes', // Example
                RUC_CONTRATISTA: '1723456789001',
                DOMICILIO_CONTRATISTA: 'Quito, Ecuador',
                CIUDAD_FIRMA: leadCity || 'Quito',
                CIUDAD_JURISDICCION: 'Quito'
            }));
        }
    }, [isOpen, leadName, leadCity]);

    // Sync financial values to variables
    useEffect(() => {
        setVariables(prev => ({
            ...prev,
            VALOR_TOTAL: contractValue,
            VALOR_ANTICIPO: initialPayment,
            // Simple calc for saldo
            VALOR_SALDO: (parseFloat(contractValue || '0') - parseFloat(initialPayment || '0')).toFixed(2),
            PORCENTAJE_ANTICIPO: contractValue && parseFloat(contractValue) > 0
                ? ((parseFloat(initialPayment || '0') / parseFloat(contractValue)) * 100).toFixed(0)
                : '0',
            PORCENTAJE_SALDO: contractValue && parseFloat(contractValue) > 0
                ? ((1 - (parseFloat(initialPayment || '0') / parseFloat(contractValue))) * 100).toFixed(0)
                : '100'
        }));
    }, [contractValue, initialPayment]);

    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm({
            financials: {
                contractValue: parseFloat(contractValue) || 0,
                initialPayment: parseFloat(initialPayment) || 0,
                balanceDueDate
            },
            contract: {
                plan,
                variables: variables as ContractVariables
            }
        })
    }

    const balance = (parseFloat(contractValue) || 0) - (parseFloat(initialPayment) || 0)

    const updateVariable = (key: keyof ContractVariables, value: string) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        🎉 Convertir a Cliente: {leadName}
                    </DialogTitle>
                    <DialogDescription>
                        Configura el acuerdo financiero y genera el contrato automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="financials">1. Finanzas</TabsTrigger>
                        <TabsTrigger value="contract">2. Contrato</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto p-1">
                        <TabsContent value="financials" className="space-y-4 py-4 h-full">
                            <div className="space-y-2">
                                <Label htmlFor="total">Valor Total del Contrato</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="total"
                                        className="pl-9 font-bold"
                                        placeholder="0.00"
                                        value={contractValue}
                                        onChange={(e) => setContractValue(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="initial">Anticipo / Primer Pago</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="initial"
                                        className="pl-9 text-green-600 font-bold"
                                        placeholder="0.00"
                                        value={initialPayment}
                                        onChange={(e) => setInitialPayment(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Este valor se registrará como ingreso HOY.</p>
                            </div>

                            {balance > 0 && (
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                                    <div className="flex justify-between items-center text-orange-800">
                                        <span className="text-xs font-bold uppercase">Saldo Pendiente</span>
                                        <span className="text-lg font-black">${balance.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-orange-900">¿Cuándo vencerá este saldo?</Label>
                                        <div className="flex bg-white rounded-md border border-orange-200 overflow-hidden">
                                            <Input
                                                type="date"
                                                className="border-none focus-visible:ring-0"
                                                value={balanceDueDate ? format(balanceDueDate, 'yyyy-MM-dd') : ''}
                                                onChange={(e) => setBalanceDueDate(new Date(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => setActiveTab("contract")} variant="secondary">
                                    Siguiente: Contrato <FileText className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="contract" className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Plan del Contrato</Label>
                                <Select value={plan} onValueChange={(v: PlanType) => setPlan(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRO">Desarrollo Web (PRO)</SelectItem>
                                        <SelectItem value="ELITE">Plan Élite 📗</SelectItem>
                                        <SelectItem value="IMPERIO">Plan Imperio 📕</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="my-2" />

                            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {CONTRACT_VARIABLE_OPTS.map((opt) => (
                                        <div key={opt.value} className="space-y-1">
                                            <Label className="text-xs">{opt.label}</Label>
                                            <Input
                                                value={variables[opt.value as keyof ContractVariables] || ''}
                                                onChange={(e) => updateVariable(opt.value as keyof ContractVariables, e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={onClose} disabled={isConverting}>
                        Cancelar
                    </Button>
                    <Button
                        className="bg-black text-white hover:bg-zinc-800"
                        onClick={handleConfirm}
                        disabled={isConverting || !contractValue}
                    >
                        {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y Convertir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function format(date: Date, formatStr: string) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
