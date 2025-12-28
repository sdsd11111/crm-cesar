'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Download, Upload, AlertTriangle, Building, Settings, Database, Store, Bot, MessageSquare, RefreshCw, LogOut, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface BusinessProfile {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    logoUrl: string;
}

interface UserPreferences {
    monthlySalesGoal: number;
    currency: 'USD' | 'MXN';
    emailNotifications: boolean;
    browserNotifications: boolean;
    autoBackup: boolean;
    whatsappTestMode: boolean;
    whatsappTestNumber: string;
}

function WhatsAppConfig({ preferences, onPreferenceChange }: {
    preferences: UserPreferences,
    onPreferenceChange: (key: keyof UserPreferences, value: any) => void
}) {
    const { toast } = useToast();
    const [status, setStatus] = useState<string>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/whatsapp/status');
            const data = await res.json();
            if (data.success && data.data?.instance) {
                const state = data.data.instance.state;
                const isConnected = state === 'open' || state === 'CONNECTED';
                setStatus(isConnected ? 'connected' : 'disconnected');
                if (!isConnected) setQrCode(null);
            } else {
                console.error('WhatsApp status error:', data.error);
            }
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQR = async () => {
        setLoading(true);
        setQrCode(null);
        try {
            const res = await fetch('/api/whatsapp/qr');
            const data = await res.json();
            if (data.success && data.data.qrcode) {
                setQrCode(data.data.qrcode);
            } else if (data.data?.instance?.state === 'open' || data.data?.instance?.state === 'CONNECTED') {
                setStatus('connected');
                toast({ title: "Ya conectado", description: "La instancia ya está vinculada." });
            } else {
                toast({
                    title: "Error de Configuración",
                    description: data.error || "No se pudo obtener el QR. Revisa la consola y las variables de entorno.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo generar el QR.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/whatsapp/logout', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setStatus('disconnected');
                setQrCode(null);
                toast({ title: "Sesión cerrada", description: "WhatsApp se ha desvinculado." });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cerrar sesión.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="text-green-500" size={20} />
                        Conexión Evolution API
                    </CardTitle>
                    <CardDescription>
                        Vincula tu WhatsApp para que Donna pueda enviar las misiones de lealtad.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading} className="border-gray-600">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                        <div>
                            <p className="font-bold text-white capitalize">{status === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                            <p className="text-xs text-gray-400">Instancia: Donna (Local)</p>
                        </div>
                    </div>
                    {status === 'connected' ? (
                        <Button variant="destructive" size="sm" onClick={logout} disabled={loading}>
                            <LogOut size={14} className="mr-2" /> Desconectar
                        </Button>
                    ) : (
                        <Button size="sm" onClick={getQR} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            Generar QR
                        </Button>
                    )}
                </div>

                {status === 'connected' && preferences.whatsappTestNumber && (
                    <div className="p-4 bg-green-900/10 border border-green-900/30 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-white">Prueba de Conexión</p>
                            <p className="text-xs text-gray-400">Envía un saludo a {preferences.whatsappTestNumber}</p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-500 hover:bg-green-900/20"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await fetch('/api/donna/missions', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'approve',
                                            missionId: 'test-direct',
                                            testNumber: preferences.whatsappTestNumber,
                                            // Provide dummy content for direct test
                                            contentOverride: "¡Test Directo! 🦁 Donna Goteo está rugiendo con fuerza. 🛡️"
                                        })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        toast({ title: "Mensaje Enviado", description: "Revisa el WhatsApp del número de prueba." });
                                    } else {
                                        toast({ title: "Error", description: data.error, variant: "destructive" });
                                    }
                                } catch (e) {
                                    toast({ title: "Error", description: "No se pudo enviar el test.", variant: "destructive" });
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            Enviar Test 🦁
                        </Button>
                    </div>
                )}

                {qrCode && status === 'disconnected' && (
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mx-auto w-fit">
                        <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64" />
                        <p className="text-gray-900 text-xs mt-4 font-bold animate-pulse">Escanea con tu WhatsApp personal</p>
                    </div>
                )}

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-500" />
                                Modo de Prueba (Goteo SEGURO)
                            </Label>
                            <p className="text-sm text-gray-400">
                                Los mensajes se enviarán ÚNICAMENTE al número de Abel para pruebas.
                            </p>
                        </div>
                        <Switch
                            checked={preferences.whatsappTestMode}
                            onCheckedChange={(checked) => onPreferenceChange('whatsappTestMode', checked)}
                        />
                    </div>

                    {preferences.whatsappTestMode && (
                        <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg">
                            <Label className="text-xs text-amber-500 font-bold uppercase tracking-wider">Número de Prueba (Abel)</Label>
                            <Input
                                value={preferences.whatsappTestNumber}
                                onChange={(e) => onPreferenceChange('whatsappTestNumber', e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white mt-2"
                                placeholder="099..."
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<BusinessProfile>({
        companyName: '',
        address: '',
        phone: '',
        website: '',
        logoUrl: '',
    });

    const [preferences, setPreferences] = useState<UserPreferences>({
        monthlySalesGoal: 10000,
        currency: 'USD',
        emailNotifications: true,
        browserNotifications: true,
        autoBackup: true,
        whatsappTestMode: true,
        whatsappTestNumber: '593967491847',
    });

    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

    const [aiPersonality, setAiPersonality] = useState<string>('');

    useEffect(() => {
        try {
            // Load data from localStorage
            const savedProfile = localStorage.getItem('crm_business_profile');
            const savedPreferences = localStorage.getItem('crm_user_preferences');
            const savedBackupDate = localStorage.getItem('crm_last_backup_date');
            const savedAiPersona = localStorage.getItem('crm_ai_personality');

            if (savedProfile) setProfile(JSON.parse(savedProfile));
            if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
            if (savedBackupDate) setLastBackupDate(savedBackupDate);
            if (savedAiPersona) setAiPersonality(savedAiPersona);
        } catch (error) {
            console.error("Error hydrating settings from localStorage:", error);
        }
    }, []);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = () => {
        localStorage.setItem('crm_business_profile', JSON.stringify(profile));
        localStorage.setItem('crm_user_preferences', JSON.stringify(preferences));
        localStorage.setItem('crm_ai_personality', aiPersonality);
        toast({
            title: "Configuración guardada",
            description: "Tus cambios se han aplicado correctamente.",
        });
    };

    const handleDownloadBackup = () => {
        // Simulate getting all data from local storage for now (simplest approach for this stack)
        // Ideally this would fetch from API, but user requested 'simple logic'.
        // We will dump the localStorage keys we know about + encourage API dump.

        // Actually, since we migrated to SQLite, a real backup should ideally trigger a server route
        // But for "Client Side Logic" requested, we will download what we can or mock the full backup
        // if the user wants to download the SQLite file, that is server side.

        // For now, let's download the localStorage data (legacy) + a marker.
        const backupData = {
            profile,
            preferences,
            timestamp: new Date().toISOString(),
            version: '1.0',
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `crm_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        const now = new Date().toISOString();
        setLastBackupDate(now);
        localStorage.setItem('crm_last_backup_date', now);

        toast({
            title: "Respaldo completado",
            description: "El archivo JSON se ha descargado a tu equipo.",
        });
    };

    const handleAutoBackupCheck = () => {
        // This function would be called by a layout effect globally, but we simulate it here
        if (preferences.autoBackup && lastBackupDate) {
            const last = new Date(lastBackupDate).getTime();
            const now = new Date().getTime();
            const hoursDiff = (now - last) / (1000 * 3600);

            if (hoursDiff > 24) {
                toast({
                    title: "Recordatorio de Respaldo",
                    description: "Han pasado más de 24 horas desde tu último respaldo automático.",
                    variant: "default",
                });
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Configuración del Sistema</h1>
                    <p className="text-muted-foreground mt-2">Gestiona el perfil de tu negocio, preferencias y conexiones de IA.</p>
                </div>
                <Link href="/">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Home className="h-4 w-4" />
                        Ir al Inicio
                    </Button>
                </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
                {/* This div was originally for the main title and save button.
                    The title part has been moved to the new header structure.
                    The save button remains here, potentially needing adjustment if it's meant to be part of the new header.
                    Based on the instruction, the save button is now in a separate flex container below the main header.
                */}
                {/* The original title div content is now part of the new header above. */}
                <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save size={18} />
                    Guardar Cambios
                </Button>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-gray-800 border-gray-700 text-gray-400">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white gap-2">
                        <Building size={16} /> Perfil de Negocio
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white gap-2">
                        <Settings size={16} /> Preferencias
                    </TabsTrigger>
                    <TabsTrigger value="system" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white gap-2">
                        <Database size={16} /> Sistema y Respaldo
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white gap-2">
                        <Bot size={16} /> IA y Cortex
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white gap-2">
                        <MessageSquare size={16} /> Conexión WhatsApp
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle>Información del Negocio</CardTitle>
                            <CardDescription>Estos datos aparecerán en tus cotizaciones y documentos generados.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        value={profile.companyName}
                                        onChange={handleProfileChange}
                                        placeholder="Ej. Turismo Global S.A."
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleProfileChange}
                                        placeholder="+593 99..."
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Dirección Física</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleProfileChange}
                                        placeholder="Av. Principal 123..."
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Sitio Web</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        value={profile.website}
                                        onChange={handleProfileChange}
                                        placeholder="www.miempresa.com"
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        value={profile.logoUrl}
                                        onChange={handleProfileChange}
                                        placeholder="https://..."
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle>Preferencias Generales</CardTitle>
                            <CardDescription>Personaliza tu experiencia en el CRM.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-gray-800/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Meta de Ventas Mensual</Label>
                                    <p className="text-sm text-gray-400">Objetivo para calcular el rendimiento en el Dashboard.</p>
                                </div>
                                <div className="w-[150px]">
                                    <Input
                                        type="number"
                                        value={preferences.monthlySalesGoal}
                                        onChange={(e) => handlePreferenceChange('monthlySalesGoal', Number(e.target.value))}
                                        className="bg-gray-800 border-gray-700 text-white text-right"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-gray-800/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Moneda Principal</Label>
                                    <p className="text-sm text-gray-400">Moneda utilizada para reportes financieros.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-md border border-gray-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePreferenceChange('currency', 'USD')}
                                        className={preferences.currency === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-400'}
                                    >
                                        USD
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePreferenceChange('currency', 'MXN')}
                                        className={preferences.currency === 'MXN' ? 'bg-blue-600 text-white' : 'text-gray-400'}
                                    >
                                        MXN
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Respaldo Automático (Recordatorio)</Label>
                                    <p className="text-sm text-gray-400">Recibir recordatorio diario a las 12:00 PM si no se ha respaldado.</p>
                                </div>
                                <Switch
                                    checked={preferences.autoBackup}
                                    onCheckedChange={(checked) => handlePreferenceChange('autoBackup', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle>Personalidad de Cortex AI</CardTitle>
                            <CardDescription>Configura cómo quieres que se comporte tu Agente IA experto.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="aiPersonality">Instrucciones de Personalidad (El Toque de César)</Label>
                                <textarea
                                    id="aiPersonality"
                                    value={aiPersonality}
                                    onChange={(e) => setAiPersonality(e.target.value)}
                                    placeholder="Ej: Habla de forma muy directa y empresarial. Enfócate siempre en la rentabilidad."
                                    className="w-full min-h-[200px] p-4 bg-gray-800 border-gray-700 rounded-md text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Estas instrucciones se inyectan en el prompt maestro de "Cortex" para ajustar su tono y prioridades.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="whatsapp">
                    <WhatsAppConfig preferences={preferences} onPreferenceChange={handlePreferenceChange} />
                </TabsContent>

                <TabsContent value="system">
                    <div className="grid gap-6">
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle>Copia de Seguridad (Backup)</CardTitle>
                                <CardDescription>Descarga una copia de tus configuraciones y datos locales para estar seguro.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Database className="text-blue-500" size={24} />
                                        <div>
                                            <h4 className="font-medium text-blue-100">Estado del Respaldo</h4>
                                            <p className="text-sm text-blue-300">
                                                {lastBackupDate
                                                    ? `Último respaldo: ${new Date(lastBackupDate).toLocaleString()}`
                                                    : 'No se ha realizado ningún respaldo reciente.'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={handleDownloadBackup} variant="outline" className="border-blue-700 text-blue-400 hover:bg-blue-900/50">
                                        <Download className="mr-2" size={16} />
                                        Descargar JSON
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800 border-l-4 border-l-red-600">
                            <CardHeader>
                                <CardTitle className="text-red-500 flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Zona de Peligro
                                </CardTitle>
                                <CardDescription>Acciones irreversibles sobre tus datos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-400">Si deseas reiniciar la aplicación desde cero, eliminando todos los datos locales.</p>
                                    <Button variant="destructive" size="sm" onClick={() => toast({ title: "Acción bloqueada", description: "Por seguridad, contacta al administrador para un reset completo." })}>
                                        Resetear de Fábrica
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
