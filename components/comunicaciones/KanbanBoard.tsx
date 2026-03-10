'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Loader2 } from 'lucide-react';

interface Card {
    id: string;
    contactName: string;
    lastMessage: string;
    lastMessageTime: Date | string;
    channelSource: string;
    unreadCount: number;
}

interface Column {
    id: string;
    title: string;
    color: string;
    cards: Card[];
}

interface KanbanBoardProps {
    onCardClick: (contactId: string) => void;
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<Card | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        })
    );

    // Fetch Kanban data
    useEffect(() => {
        fetchKanbanData();
        const interval = setInterval(fetchKanbanData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchKanbanData = async () => {
        try {
            const res = await fetch('/api/conversations/kanban');
            const data = await res.json();

            const columnsData = [
                {
                    id: 'entrada',
                    title: 'Entrada',
                    color: 'blue',
                    cards: data.entrada || [],
                },
                {
                    id: 'donna',
                    title: 'Donna Activa',
                    color: 'green',
                    cards: data.donna || [],
                },
                {
                    id: 'intervencion',
                    title: 'Intervención César',
                    color: 'amber',
                    cards: data.intervencion || [],
                },
                {
                    id: 'finalizados',
                    title: 'Finalizados',
                    color: 'slate',
                    cards: data.finalizados || [],
                },
            ];

            setColumns(columnsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching kanban data:', error);
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const card = columns
            .flatMap(col => col.cards)
            .find(c => c.id === active.id);
        setActiveCard(card || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeCardId = active.id as string;
        const overColumnId = over.id as string;

        // Find source and destination columns
        const sourceColumn = columns.find(col =>
            col.cards.some((card: Card) => card.id === activeCardId)
        );
        const destColumn = columns.find(col => col.id === overColumnId);

        if (!sourceColumn || !destColumn) return;
        if (sourceColumn.id === destColumn.id) return; // Same column, no change

        // Optimistic UI update
        const movedCard = sourceColumn.cards.find(c => c.id === activeCardId);
        if (!movedCard) return;

        const newColumns = columns.map(col => {
            if (col.id === sourceColumn.id) {
                return {
                    ...col,
                    cards: col.cards.filter(c => c.id !== activeCardId),
                };
            }
            if (col.id === destColumn.id) {
                return {
                    ...col,
                    cards: [...col.cards, movedCard],
                };
            }
            return col;
        });

        setColumns(newColumns);

        // Update backend
        try {
            await fetch('/api/conversations/kanban', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: activeCardId,
                    column: destColumn.id,
                }),
            });
        } catch (error) {
            console.error('Error updating kanban:', error);
            // Revert on error
            fetchKanbanData();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-full overflow-x-auto p-4 bg-gradient-to-br from-slate-50 to-slate-100">
                {columns.map(column => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        onCardClick={onCardClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeCard ? (
                    <div className="rotate-3 scale-105 opacity-90">
                        <KanbanCard card={activeCard} onClick={() => { }} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
