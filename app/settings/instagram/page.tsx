
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, AlertCircle, ExternalLink, Key, Settings, Instagram, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function InstagramSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        appId: '',
        appSecret: '',
        verifyToken: 'objetivo_instagram_secret'
    });

    // Status tracking (In a real app, this would come from the API)
    const [status, setStatus] = useState({
        isConfigured: false,
        lastSync: null,
        error: null
    });

    useEffect(() => {
        fetch('/api/settings?key=instagram_config')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data.appId) {
                    setConfig(res.data);
                    setStatus(prev => ({ ...prev, isConfigured: true }));
                }
            })
            .catch(err => console.error('Error loading config:', err));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'instagram_config',
                    value: config
                })
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Configuración Guardada",
                    description: "Tus credenciales han sido registradas en la base de datos.",
                });
                setStatus({ ...status, isConfigured: true });
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const generateLoginUrl = () => {
        if (!config.appId) return '#';

        const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/instagram/callback` : '';
        const appId = config.appId.trim();
        const scopes = [
            'instagram_basic',
            'instagram_manage_messages',
            'pages_manage_metadata',
            'pages_show_list',
            'pages_messaging'
        ].join(',');

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
    };

    const steps = [
        {
            title: "Crear App en Meta",
            description: "Ve al portal de Meta Developers y crea una aplicación de tipo 'Business'.",
            url: "https://developers.facebook.com/apps/"
        },
        {
            title: "Configurar Productos",
            description: "Añade 'Instagram Graph API' y 'Facebook Login for Business' a tu aplicación.",
            url: null
        },
        {
            title: "Redirección OAuth",
            description: "Copia la URL de abajo y pégala en 'Valid OAuth Redirect URIs' de Facebook Login.",
            url: null,
            copy: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/instagram/callback` : ''
        }
    ];

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500 rounded-lg">
                    <Instagram className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Configuración de Instagram</h1>
                    <p className="text-muted-foreground">Conecta tu cuenta de empresa para responder mensajes desde el CRM.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left: Steps & Help */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings size={18} className="text-gray-400" />
                        Pasos de Instalación
                    </h3>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className="relative pl-6 pb-4 border-l border-gray-200 last:border-0 dark:border-gray-800">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
                                    {i + 1}
                                </div>
                                <h4 className="text-sm font-medium">{step.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                {step.url && (
                                    <a href={step.url} target="_blank" className="text-xs text-pink-500 flex items-center gap-1 mt-2 hover:underline">
                                        Abrir Meta <ExternalLink size={10} />
                                    </a>
                                )}
                                {step.copy && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                        <code className="text-[10px] truncate max-w-[120px]">{step.copy}</code>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                            navigator.clipboard.writeText(step.copy || '');
                                            toast({ title: "Copiado!" });
                                        }}>
                                            <Info size={12} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Forms */}
                <div className="md:col-span-2 space-y-6">

                    {/* App Credentials */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key size={18} className="text-pink-500" />
                                Credenciales de Aplicación
                            </CardTitle>
                            <CardDescription>
                                Obtén estos datos del panel de tu App en Meta Developers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="appId">App ID</Label>
                                <Input
                                    id="appId"
                                    placeholder="Ej: 2031222511059053"
                                    value={config.appId}
                                    onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="appSecret">App Secret</Label>
                                <Input
                                    id="appSecret"
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={config.appSecret}
                                    onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-4">
                            <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar y Validar Datos
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Connection Status */}
                    <Card className={status.isConfigured ? "border-green-500/50 bg-green-500/5" : ""}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${status.isConfigured ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Estado de la Conexión</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {status.isConfigured
                                                ? "Credenciales validadas. Listo para vincular cuenta."
                                                : "Pendiente: Configura tus credenciales arriba."}
                                        </p>
                                    </div>
                                </div>
                                {status.isConfigured && (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Activo</Badge>
                                )}
                            </div>

                            {status.isConfigured && (
                                <div className="mt-6 p-4 rounded-lg bg-white border border-gray-200 dark:bg-gray-950 dark:border-gray-800 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <AlertCircle size={16} className="text-blue-500" />
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Al hacer clic en vincular, se abrirá una ventana de Facebook. Asegúrate de seleccionar la **Página de Facebook** y la **Cuenta de Instagram** que deseas conectar al CRM.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                    >
                                        <a href={generateLoginUrl()}>
                                            Vincular Cuenta de Instagram <ArrowRight size={16} className="ml-2" />
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

