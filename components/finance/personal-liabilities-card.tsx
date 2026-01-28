"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, AlertCircle, TrendingDown, Landmark, Home, ShoppingCart, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Liability {
    id: string
    name: string
    category: string
    monthlyPayment: number
    totalDebt?: number
    remainingDebt?: number
    dueDate?: number
    status: 'UP_TO_DATE' | 'PENDING' | 'OVERDUE'
}

export function PersonalLiabilitiesCard() {
    const [liabilities, setLiabilities] = useState<Liability[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLiabilities = async () => {
        try {
            const res = await fetch('/api/finance/personal')
            if (res.ok) {
                const data = await res.json()
                setLiabilities(data)
            }
        } catch (error) {
            console.error("Error fetching liabilities", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLiabilities()
    }, [])

    const toggleStatus = async (item: Liability) => {
        const newStatus = item.status === 'UP_TO_DATE' ? 'PENDING' : 'UP_TO_DATE'
        try {
            const res = await fetch(`/api/finance/personal/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                setLiabilities(prev => prev.map(l => l.id === item.id ? { ...l, status: newStatus } : l))
                toast.success(`${item.name} actualizado`)
            }
        } catch (error) {
            toast.error("Error al actualizar")
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
    }

    const getIcon = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'préstamo': return <Landmark className="h-4 w-4" />
            case 'vivienda': return <Home className="h-4 w-4" />
            case 'alimentación': return <ShoppingCart className="h-4 w-4" />
            default: return <User className="h-4 w-4" />
        }
    }

    if (loading) return <div className="p-4 text-center">Cargando deudas personales...</div>

    return (
        <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-amber-500">
                            Control Personal (TDAH Support)
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold opacity-70">Deudas de casa y servicios básicos para mantener el enfoque.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
                {liabilities.map((item, idx) => (
                    <div
                        key={item.id}
                        className="group p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 animate-in fade-in slide-in-from-right-2"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-2xl transition-all duration-300 shadow-lg",
                                        item.status === 'UP_TO_DATE'
                                            ? "bg-green-500/20 text-green-500"
                                            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                    )}
                                    onClick={() => toggleStatus(item)}
                                >
                                    {item.status === 'UP_TO_DATE' ?
                                        <CheckCircle2 className="h-6 w-6" /> :
                                        <Circle className="h-6 w-6" />}
                                </Button>
                                <div>
                                    <p className={cn(
                                        "font-black text-lg tracking-tight transition-all",
                                        item.status === 'UP_TO_DATE' ? "opacity-40 line-through" : "text-foreground"
                                    )}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                        <div className="p-1 bg-muted rounded-md text-amber-500">
                                            {getIcon(item.category)}
                                        </div>
                                        <span className="text-foreground/80">{item.category}</span> <span className="opacity-30">•</span> <span className="text-foreground/80">Día {item.dueDate}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "font-black text-xl tracking-tighter transition-all",
                                    item.status === 'UP_TO_DATE' ? "opacity-30" : "text-foreground"
                                )}>
                                    {formatCurrency(item.monthlyPayment)}
                                </p>
                                <Badge
                                    variant={item.status === 'UP_TO_DATE' ? 'secondary' : 'default'}
                                    className={cn(
                                        "text-[9px] font-black uppercase tracking-widest h-5 border-none",
                                        item.status === 'UP_TO_DATE' ? "bg-muted text-muted-foreground" : "bg-amber-500 text-white"
                                    )}
                                >
                                    {item.status === 'UP_TO_DATE' ? 'Pagado' : 'Pendiente'}
                                </Badge>
                            </div>
                        </div>

                        {item.totalDebt && item.remainingDebt && (
                            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="opacity-50 text-amber-500/80">Progreso del Capital</span>
                                    <span className="text-foreground">{formatCurrency(item.totalDebt - item.remainingDebt)} <span className="opacity-20">/</span> {formatCurrency(item.totalDebt)}</span>
                                </div>
                                <Progress
                                    value={((item.totalDebt - item.remainingDebt) / item.totalDebt) * 100}
                                    className="h-1.5 bg-amber-500/10"
                                />
                            </div>
                        )}
                    </div>
                ))}

                {liabilities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <CheckCircle2 className="h-12 w-12 mb-4 text-amber-500/50" />
                        <h3 className="text-sm font-black uppercase tracking-widest">¡Libertad financiera!</h3>
                        <p className="text-[10px] font-medium mt-1">No hay gastos personales pendientes registrados.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
