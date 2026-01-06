
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Phone } from 'lucide-react'; // Icons for WA/Telegram

interface Conversation {
    id: string;
    contactName: string;
    phone: string;
    lastActivityAt?: string;
    channelSource?: 'whatsapp' | 'telegram';
    unreadCount?: number;
    status?: string; // Added for pipeline view
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId?: string;
    onSelect: (id: string) => void;
    viewMode?: 'inbox' | 'pipeline';
}

export function ConversationList({ conversations, selectedId, onSelect, viewMode = 'inbox' }: ConversationListProps) {
    if (viewMode === 'pipeline') {
        // Simple grouping by status
        const statuses = ['sin_contacto', 'primer_contacto', 'seguimiento', 'negocicion', 'cerrado'];
        // You might want to type this properly or fetch status list

        return (
            <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-2">
                    {statuses.map(status => {
                        const items = conversations.filter(c => c.status === status);
                        if (items.length === 0) return null;

                        return (
                            <div key={status} className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">{status.replace('_', ' ')}</h4>
                                {items.map(conv => (
                                    <ConversationItem key={conv.id} conv={conv} selectedId={selectedId} onSelect={onSelect} />
                                ))}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {conversations.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} selectedId={selectedId} onSelect={onSelect} />
                ))}
            </div>
        </ScrollArea>
    );
}

function ConversationItem({ conv, selectedId, onSelect }: { conv: Conversation, selectedId?: string, onSelect: (id: string) => void }) {
    return (
        <button
            onClick={() => onSelect(conv.id)}
            className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent ${selectedId === conv.id ? "bg-accent" : ""
                }`}
        >
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{conv.contactName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="font-semibold">{conv.contactName}</div>
                </div>
                {conv.lastActivityAt && !isNaN(new Date(conv.lastActivityAt).getTime()) && (
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.lastActivityAt), 'HH:mm', { locale: es })}
                    </span>
                )}
            </div>

            <div className="flex w-full items-center justify-between">
                <span className="line-clamp-2 text-xs text-muted-foreground w-[80%]">
                    {conv.phone || 'Sin número'}
                </span>
                {/* Channel Icon */}
                {conv.channelSource === 'telegram' ? (
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                ) : (
                    <Phone className="h-4 w-4 text-green-500" />
                )}
            </div>

            {conv.unreadCount && conv.unreadCount > 0 ? (
                <Badge variant="destructive" className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-[10px]">
                    {conv.unreadCount}
                </Badge>
            ) : null}
        </button>
    );
}

