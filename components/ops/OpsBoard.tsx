
"use client";

import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OpsBoard() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/conversations?limit=30')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setConversations(data);
                } else {
                    console.error("API returned invalid data format:", data);
                    setConversations([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load conversations", err);
                setLoading(false);
            });
    }, []);

    const selectedConversation = conversations.find(c => c.id === selectedId);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full border rounded-lg overflow-hidden">
                {/* Left Panel: Inbox / Pipeline */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                    <div className="flex flex-col h-full bg-muted/20">
                        <div className="p-3 border-b">
                            <Tabs defaultValue="inbox" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="inbox">Mesa de Entrada</TabsTrigger>
                                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Main Panel: Chat / Board */}
                <ResizablePanel defaultSize={70}>
                    {selectedId && selectedConversation ? (
                        <ChatView
                            contactId={selectedId}
                            contactName={selectedConversation.contactName}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Selecciona una conversación para comenzar
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
