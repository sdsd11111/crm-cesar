
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

interface CreateContactDialogProps {
    contactId: string;
    phoneNumber: string;
}

export function CreateContactDialog({ contactId, phoneNumber }: CreateContactDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const router = useRouter();

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactName: name,
                    phone: phoneNumber,
                    source: 'ops_manual'
                })
            });

            if (!res.ok) throw new Error('Failed to create contact');

            toast.success("Contacto creado exitosamente");
            setOpen(false);
            window.location.reload(); // Refresh to update name in UI
        } catch (error) {
            console.error(error);
            toast.error("Error al crear contacto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <UserPlus className="h-4 w-4" />
                    Crear Contacto
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Guardar Nuevo Contacto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Número detectado</Label>
                        <Input value={phoneNumber} disabled className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Nombre Completo</Label>
                        <Input
                            placeholder="Ej: Javier (Asistente Dr. Reyes)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        Guardar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
