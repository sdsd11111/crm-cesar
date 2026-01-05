"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw, Smartphone, Server } from 'lucide-react';

export default function WhatsAppTestPage() {
    const [phone, setPhone] = useState('593');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch raw logs from our new test endpoint
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/whatsapp/test-history');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-refresh logs every 5 seconds
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSend = async () => {
        if (!phone || !message) return;
        setLoading(true);
        setStatus('Enviando...');

        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone.replace(/\D/g, ''), // Clean non-digits
                    text: message,
                    metadata: { type: 'manual_test', source: 'whatsapp_test_page' }
                })
            });
            const data = await res.json();

            if (data.success) {
                setStatus('✅ Mensaje Enviado. Revisa los logs abajo.');
                setMessage(''); // Clear message but keep phone
                fetchLogs(); // Immediate refresh
            } else {
                setStatus(`❌ Error: ${data.error}`);
            }
        } catch (error: any) {
            setStatus(`❌ Error de Red: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Smartphone className="text-green-500" />
                            WhatsApp API Tester
                        </h1>
                        <p className="text-gray-400 text-sm">Herramienta de diagnóstico directo sin filtros de UI.</p>
                    </div>
                    <Badge variant="outline" className="border-green-500/50 text-green-500">
                        Estado: Live
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Panel: Sender */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Send size={16} /> Enviar Mensaje
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">Número de Teléfono (con código país, ej: 593...)</label>
                                <Input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="bg-gray-950 border-gray-700 font-mono text-lg"
                                    placeholder="593999999999"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">Contenido del Mensaje</label>
                                <Textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="bg-gray-950 border-gray-700 min-h-[100px]"
                                    placeholder="Hola, esto es una prueba..."
                                />
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={loading || !message}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            >
                                {loading ? 'Enviando...' : 'Enviar Prueba'}
                            </Button>

                            {status && (
                                <div className={`p-3 rounded text-sm font-mono ${status.includes('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                                    {status}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Panel: Raw Logs */}
                    <Card className="bg-gray-900 border-gray-800 flex flex-col h-[500px]">
                        <CardHeader className="border-b border-gray-800 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Server size={16} /> Raw Database Logs
                                </CardTitle>
                                <Button size="sm" variant="ghost" onClick={fetchLogs}><RefreshCw size={14} /></Button>
                            </div>
                            <p className="text-[10px] text-gray-500">Mostrando últimos 50 registros de la tabla 'interactions' (type=whatsapp)</p>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0 scrollbar-hide">
                            <div className="divide-y divide-gray-800 font-mono text-xs">
                                {logs.map((log, i) => (
                                    <div key={i} className="p-3 hover:bg-gray-800 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.direction === 'inbound' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {log.direction?.toUpperCase()}
                                            </span>
                                            <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-gray-300 break-words whitespace-pre-wrap">
                                            {log.content}
                                        </div>
                                        <div className="mt-1 text-[9px] text-gray-600 flex gap-2">
                                            <span>Start ID: {log.id.slice(0, 8)}...</span>
                                            <span>Contact ID: {log.contactId ? log.contactId.slice(0, 8) + '...' : '(NULL)'}</span>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="p-8 text-center text-gray-600 italic">No hay registros recientes</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
