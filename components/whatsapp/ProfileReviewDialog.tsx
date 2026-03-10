
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Save, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileReviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    contactId: string;
    onConfirm: (updatedData: any) => Promise<void>;
}

export function ProfileReviewDialog({ isOpen, onClose, data, contactId, onConfirm }: ProfileReviewDialogProps) {
    const [editedData, setEditedData] = useState(data);
    const [isSaving, setIsSaving] = useState(false);

    const handleFieldChange = (field: string, value: any) => {
        setEditedData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onConfirm(editedData);
            toast.success("Perfil actualizado correctamente ✨");
            onClose();
        } catch (error) {
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const renderEditableField = (label: string, field: string, type: 'text' | 'textarea' = 'text') => {
        const value = editedData[field] || '';
        return (
            <div className="space-y-2 mb-4">
                <Label htmlFor={field} className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
                {type === 'text' ? (
                    <Input
                        id={field}
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="bg-muted/30 border-primary/10"
                    />
                ) : (
                    <Textarea
                        id={field}
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="bg-muted/30 border-primary/10 min-h-[80px]"
                    />
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Revisión de Perfil IA</DialogTitle>
                            <DialogDescription>
                                Hemos analizado la conversación. Revisa y edita los datos antes de guardar.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div className="col-span-2">
                            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Datos Principales
                            </h3>
                        </div>
                        {renderEditableField("Nombre del Negocio", "businessName")}
                        {renderEditableField("Persona de Contacto", "contactName")}
                        {renderEditableField("Teléfono", "phone")}
                        {renderEditableField("Email", "email")}
                        {renderEditableField("Ciudad", "city")}
                        {renderEditableField("Actividad Comercial", "businessActivity")}

                        <div className="col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Análisis de Estrategia
                            </h3>
                        </div>
                        <div className="col-span-2">
                            {renderEditableField("Dolores / Necesidades", "pains", "textarea")}
                            {renderEditableField("Objetivos", "goals", "textarea")}
                            {renderEditableField("Objeciones", "objections", "textarea")}
                            {renderEditableField("Acuerdos Verbales", "verbalAgreements", "textarea")}
                        </div>

                        <div className="col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary rounded-full" />
                                Métricas de Negocio
                            </h3>
                        </div>
                        {renderEditableField("Años en el Negocio", "yearsInBusiness")}
                        {renderEditableField("Nº Empleados", "numberOfEmployees")}
                        {renderEditableField("Volumen Clientes/Mes", "currentClientsPerMonth")}
                        {renderEditableField("Ticket Promedio", "averageTicket")}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 bg-muted/20 border-t flex-row justify-between sm:justify-between items-center">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Confirmar y Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
