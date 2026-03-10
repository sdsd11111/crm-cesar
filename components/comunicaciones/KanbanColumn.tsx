'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    column: {
        id: string;
        title: string;
        color: string;
        cards: any[];
    };
    onCardClick: (cardId: string) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    const getColumnStyles = (color: string) => {
        const styles: Record<string, string> = {
            blue: 'bg-blue-50/50 border-blue-200',
            green: 'bg-green-50/50 border-green-200',
            amber: 'bg-amber-50/50 border-amber-200',
            slate: 'bg-slate-50/50 border-slate-200',
        };
        return styles[color] || styles.slate;
    };

    const getHeaderStyles = (color: string) => {
        const styles: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-800 border-blue-200',
            green: 'bg-green-100 text-green-800 border-green-200',
            amber: 'bg-amber-100 text-amber-800 border-amber-200',
            slate: 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return styles[color] || styles.slate;
    };

    const getBadgeStyles = (color: string) => {
        const styles: Record<string, string> = {
            blue: 'bg-blue-600 text-white',
            green: 'bg-green-600 text-white',
            amber: 'bg-amber-600 text-white',
            slate: 'bg-slate-600 text-white',
        };
        return styles[color] || styles.slate;
    };

    return (
        <div
            className={`flex-shrink-0 w-80 rounded-xl border-2 flex flex-col transition-all ${getColumnStyles(column.color)} ${isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                }`}
        >
            {/* Header */}
            <div className={`px-4 py-3 border-b-2 rounded-t-xl ${getHeaderStyles(column.color)}`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm uppercase tracking-wider">
                        {column.title}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${getBadgeStyles(column.color)}`}>
                        {column.cards.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <div ref={setNodeRef} className="flex-1 p-3 min-h-[200px]">
                <ScrollArea className="h-full pr-2">
                    <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {column.cards.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
                                Sin conversaciones
                            </div>
                        ) : (
                            column.cards.map(card => (
                                <KanbanCard
                                    key={card.id}
                                    card={card}
                                    onClick={() => onCardClick(card.id)}
                                />
                            ))
                        )}
                    </SortableContext>
                </ScrollArea>
            </div>
        </div>
    );
}
