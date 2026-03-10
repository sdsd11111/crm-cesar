
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Database, Lock } from 'lucide-react';

export default function LegalPage() {
    return (
        <div className="container mx-auto py-20 max-w-3xl space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Legal & Privacidad</h1>
                <p className="text-muted-foreground italic">Cumplimiento con las políticas de Meta para el CRM Objetivo.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-pink-500" />
                        Política de Privacidad
                    </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
                    <p>
                        El **CRM Objetivo** utiliza la API de Instagram para permitir a los usuarios gestionar sus mensajes directos de forma centralizada.
                        No vendemos ni compartimos sus datos con terceros.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Datos recolectados:</strong> Identificadores de usuario y contenido de mensajes para su visualización en el dashboard.</li>
                        <li><strong>Uso de datos:</strong> Exclusivamente para la gestión comercial del usuario dentro de la plataforma.</li>
                        <li><strong>Almacenamiento:</strong> Los datos se almacenan en servidores seguros con cifrado de extremo a extremo.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="text-blue-500" />
                        Solicitud de Eliminación de Datos
                    </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
                    <p>
                        Si desea eliminar sus datos de Facebook/Instagram de nuestra plataforma, siga estos pasos:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Vaya a la sección de **Configuración &rarr; Instagram** dentro del CRM.</li>
                        <li>Haga clic en el botón **"Desvincular Cuenta"**.</li>
                        <li>Esto eliminará inmediatamente de nuestros servidores todos los tokens de acceso y datos asociados a su cuenta de Instagram.</li>
                    </ol>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Alternativamente, puede enviar un correo a <strong>soporte@objetivo.com</strong> con el asunto "Eliminación de Datos Meta".
                    </p>
                </CardContent>
            </Card>

            <footer className="text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Grupo Empresarial Reyes - CRM Objetivo
            </footer>
        </div>
    );
}
