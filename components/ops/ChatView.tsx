
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientLinkDialog } from './ClientLinkDialog';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    messageTimestamp: string;
    platform: string;
}

interface ChatViewProps {
    contactId: string;
    contactName: string;
}

export function ChatView({ contactId, contactName }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch History
    useEffect(() => {
        if (!contactId) return;
        setLoading(true);
        fetch(`/api/conversations/${contactId}/history`)
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load history", err);
                setLoading(false);
            });
    }, [contactId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);

        const tempId = Date.now().toString();
        // Optimistic UI
        const optimisticMsg: Message = {
            id: tempId,
            role: 'assistant',
            content: input,
            messageTimestamp: new Date().toISOString(),
            platform: 'whatsapp' // default
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInput('');

        try {
            const res = await fetch(`/api/conversations/${contactId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: optimisticMsg.content })
            });

            if (!res.ok) throw new Error('Send failed');

            // In a real app, we'd replace the optimistic msg or re-fetch
        } catch (error) {
            console.error("Send error", error);
            // Revert or show error
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }



    // ...

    return (
        <div className="flex flex-col h-full bg-background border rounded-md overflow-hidden">
            {/* Header */}
            <div className="bg-muted p-3 border-b flex justify-between items-center">
                <div className="flex flex-col">
                    <h3 className="font-semibold">{contactName}</h3>
                    <span className="text-xs text-muted-foreground">Unified Channel View</span>
                </div>
                <div className="flex gap-2">
                    <ClientLinkDialog contactId={contactId} />
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col gap-4 pb-4">
                    {messages.length === 0 && <div className="text-center text-muted-foreground mt-10">No hay mensajes recientes.</div>}

                    {messages.map((msg) => {
                        const isAssistant = msg.role === 'assistant';
                        const isSystem = msg.role === 'system';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-2">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex ${isAssistant ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${isAssistant
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 text-right ${isAssistant ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {msg.messageTimestamp && !isNaN(new Date(msg.messageTimestamp).getTime())
                                            ? format(new Date(msg.messageTimestamp), 'HH:mm', { locale: es })
                                            : ''} • {msg.platform}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Footer / Input */}
            <div className="p-3 border-t bg-background flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                    placeholder="Escribe un mensaje..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()}>
                    {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
