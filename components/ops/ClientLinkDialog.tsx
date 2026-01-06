
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link as LinkIcon, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

interface ClientLinkDialogProps {
    contactId: string;
    onLinked?: () => void;
}

export function ClientLinkDialog({ contactId, onLinked }: ClientLinkDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<Client[]>([]);
    const [linking, setLinking] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async (term: string) => {
        setSearch(term);
        if (term.length < 3) return;

        setSearching(true);
        try {
            // Adjust endpoint if needed, assuming /api/clients/search?q=...
            const res = await fetch(`/api/clients/search?query=${encodeURIComponent(term)}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const handleLink = async (clientId: string) => {
        setLinking(clientId);
        try {
            const res = await fetch(`/api/conversations/${contactId}/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });

            if (res.ok) {
                toast({ title: "Vinculación Exitosa", description: "El contacto se ha unificado con el cliente." });
                setOpen(false);
                if (onLinked) onLinked();
            } else {
                throw new Error("Failed to link");
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo vincular.", variant: "destructive" });
        } finally {
            setLinking(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-blue-600">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span className="text-xs">Vincular Cliente</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vincular a Cliente Existente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <Input
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />

                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                        {searching && <Loader2 className="animate-spin h-4 w-4 mx-auto" />}
                        {!searching && results.length === 0 && search.length > 2 && (
                            <p className="text-sm text-center text-muted-foreground">No encontrado</p>
                        )}
                        {results.map(client => (
                            <div key={client.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <div className="text-sm">
                                        <div className="font-medium">{client.firstName} {client.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{client.email}</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLink(client.id)}
                                    disabled={!!linking}
                                >
                                    {linking === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Seleccionar'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
