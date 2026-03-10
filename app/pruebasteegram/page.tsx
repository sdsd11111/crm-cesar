'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Calendar, FileText, Activity, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

interface TestLog {
    timestamp: string;
    step: string;
    data: any;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface CalendarEvent {
    summary: string;
    start: string;
    end: string;
}

export default function PruebasTelegramPage() {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [reply, setReply] = useState('');
    const [logs, setLogs] = useState<TestLog[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [duration, setDuration] = useState('');

    // Prompts editables
    const [routerPrompt, setRouterPrompt] = useState('');
    const [createPrompt, setCreatePrompt] = useState('');
    const [queryPrompt, setQueryPrompt] = useState('');
    const [useCustomPrompts, setUseCustomPrompts] = useState(false);

    const handleTest = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        setReply('');
        setLogs([]);
        setCalendarEvents([]);

        try {
            const response = await fetch('/api/telegram/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: inputText,
                    customPrompts: useCustomPrompts ? {
                        router: routerPrompt,
                        create: createPrompt,
                        query: queryPrompt
                    } : undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                setReply(data.reply);
                setLogs(data.logs || []);
                setCalendarEvents(data.calendarEvents || []);
                setDuration(data.duration);

                // Cargar prompts si no están editados
                if (!useCustomPrompts && data.prompts) {
                    setRouterPrompt(data.prompts.router);
                    setCreatePrompt(data.prompts.create);
                    setQueryPrompt(data.prompts.query);
                }
            } else {
                setReply(`❌ Error: ${data.error}`);
                setLogs(data.logs || []);
            }
        } catch (error: any) {
            setReply(`❌ Error de red: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'success': return 'border-l-green-500 bg-green-50 border-green-100';
            case 'error': return 'border-l-red-500 bg-red-50 border-red-100';
            case 'warning': return 'border-l-yellow-500 bg-yellow-50 border-yellow-100';
            default: return 'border-l-blue-500 bg-blue-50 border-blue-100';
        }
    };

    const quickTests = [
        { label: 'Consultar Agenda', text: 'Revisa mi agenda para el lunes' },
        { label: 'Crear Evento', text: 'Agenda reunión mañana a las 3pm con Juan' },
        { label: 'Agenda Hoy', text: 'Qué tengo hoy?' },
        { label: 'Crear sin hora', text: 'Agendar llamada con cliente el viernes' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        🧪 Telegram Testing Lab
                    </h1>
                    <p className="text-slate-600">
                        Prueba el flujo completo de Donna: clasificación → Google Calendar → respuesta
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Input & Response */}
                    <div className="space-y-6">
                        {/* Input Panel */}
                        <Card className="border-2 border-blue-200 shadow-lg bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="w-5 h-5 text-blue-600" />
                                    Mensaje de Prueba
                                </CardTitle>
                                <CardDescription>
                                    Simula un mensaje de Telegram
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Ej: Revisa mi agenda para el lunes..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="min-h-[100px] text-base bg-white text-slate-900"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            handleTest();
                                        }
                                    }}
                                />

                                {/* Quick Test Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {quickTests.map((test, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                setInputText(test.text);
                                                // Esperar un tick para que el estado se actualice
                                                setTimeout(async () => {
                                                    if (!loading) {
                                                        setLoading(true);
                                                        setReply('');
                                                        setLogs([]);
                                                        setCalendarEvents([]);

                                                        try {
                                                            const response = await fetch('/api/telegram/test', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    text: test.text,
                                                                    customPrompts: useCustomPrompts ? {
                                                                        router: routerPrompt,
                                                                        create: createPrompt,
                                                                        query: queryPrompt
                                                                    } : undefined
                                                                })
                                                            });

                                                            const data = await response.json();

                                                            if (data.success) {
                                                                setReply(data.reply);
                                                                setLogs(data.logs || []);
                                                                setCalendarEvents(data.calendarEvents || []);
                                                                setDuration(data.duration);

                                                                if (!useCustomPrompts && data.prompts) {
                                                                    setRouterPrompt(data.prompts.router);
                                                                    setCreatePrompt(data.prompts.create);
                                                                    setQueryPrompt(data.prompts.query);
                                                                }
                                                            } else {
                                                                setReply(`❌ Error: ${data.error}`);
                                                                setLogs(data.logs || []);
                                                            }
                                                        } catch (error: any) {
                                                            setReply(`❌ Error de red: ${error.message}`);
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }
                                                }, 100);
                                            }}
                                            disabled={loading}
                                            className="text-xs"
                                        >
                                            {test.label}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleTest}
                                    disabled={loading || !inputText.trim()}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                    size="lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Probar (Ctrl+Enter)
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Response Panel */}
                        {reply && (
                            <Card className="border-2 border-green-200 shadow-lg bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-green-600" />
                                        Respuesta de Donna
                                        {duration && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {duration}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 bg-slate-900 rounded-lg border-2 border-green-400 whitespace-pre-wrap font-mono text-sm text-green-400 shadow-inner">
                                        {reply}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Calendar Events */}
                        {calendarEvents.length > 0 && (
                            <Card className="border-2 border-purple-200 shadow-lg bg-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        Google Calendar
                                        <Badge variant="secondary" className="ml-auto">
                                            {calendarEvents.length} eventos
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px]">
                                        <div className="space-y-2">
                                            {calendarEvents.map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                                                >
                                                    <div className="font-semibold text-purple-900">
                                                        {event.summary}
                                                    </div>
                                                    <div className="text-sm text-purple-700 mt-1">
                                                        📅 {new Date(event.start).toLocaleString('es-ES')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Logs & Prompts */}
                    <div className="space-y-6">
                        <Tabs defaultValue="logs" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="logs">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Logs
                                </TabsTrigger>
                                <TabsTrigger value="prompts">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Prompts
                                </TabsTrigger>
                            </TabsList>

                            {/* Logs Tab */}
                            <TabsContent value="logs">
                                <Card className="border-2 border-slate-200 shadow-lg bg-white">
                                    <CardHeader>
                                        <CardTitle>Logs del Proceso</CardTitle>
                                        <CardDescription>
                                            Seguimiento detallado de cada paso
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            {logs.length === 0 ? (
                                                <div className="text-center text-slate-400 py-12">
                                                    Los logs aparecerán aquí después de ejecutar una prueba
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {logs.map((log, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-3 rounded-lg border-l-4 shadow-sm border ${getLogColor(log.type)}`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                {getLogIcon(log.type)}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                        {log.step}
                                                                    </div>
                                                                    <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                                    </div>
                                                                    <pre className="mt-2 text-xs bg-slate-950 text-blue-300 p-3 rounded-md overflow-x-auto border border-slate-800 shadow-inner leading-relaxed">
                                                                        {JSON.stringify(log.data, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Prompts Tab */}
                            <TabsContent value="prompts">
                                <Card className="border-2 border-orange-200 shadow-lg bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>Editor de Prompts</span>
                                            <Button
                                                variant={useCustomPrompts ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseCustomPrompts(!useCustomPrompts)}
                                            >
                                                {useCustomPrompts ? '✓ Usando Custom' : 'Usar Originales'}
                                            </Button>
                                        </CardTitle>
                                        <CardDescription>
                                            Visualiza y edita los prompts usados en cada paso
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <div className="space-y-4">
                                                {/* Router Prompt */}
                                                <div>
                                                    <label className="text-sm font-semibold text-orange-900 mb-2 block">
                                                        🧭 Router Classifier
                                                    </label>
                                                    <Textarea
                                                        value={routerPrompt}
                                                        onChange={(e) => setRouterPrompt(e.target.value)}
                                                        className="font-mono text-xs min-h-[150px] bg-white text-slate-900"
                                                        placeholder="Ejecuta una prueba primero para cargar los prompts..."
                                                    />
                                                </div>

                                                {/* Create Event Prompt */}
                                                <div>
                                                    <label className="text-sm font-semibold text-orange-900 mb-2 block">
                                                        ➕ Create Event
                                                    </label>
                                                    <Textarea
                                                        value={createPrompt}
                                                        onChange={(e) => setCreatePrompt(e.target.value)}
                                                        className="font-mono text-xs min-h-[200px] bg-white text-slate-900"
                                                        placeholder="Ejecuta una prueba primero para cargar los prompts..."
                                                    />
                                                </div>

                                                {/* Query Agenda Prompt */}
                                                <div>
                                                    <label className="text-sm font-semibold text-orange-900 mb-2 block">
                                                        📅 Query Agenda
                                                    </label>
                                                    <Textarea
                                                        value={queryPrompt}
                                                        onChange={(e) => setQueryPrompt(e.target.value)}
                                                        className="font-mono text-xs min-h-[150px] bg-white text-slate-900"
                                                        placeholder="Ejecuta una prueba primero para cargar los prompts..."
                                                    />
                                                </div>
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
