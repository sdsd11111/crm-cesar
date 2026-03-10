'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Edit, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { RestaurantContractPDF } from '@/components/contracts/restaurant-contract-pdf';
import { RawTextPDF } from '@/components/contracts/RawTextPDF';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button disabled><Loader2 className="animate-spin mr-2 h-4 w-4" /> Cargando...</Button>,
    }
);

interface Contract {
    id: string;
    title: string;
    status: string;
    contractData: string;
    createdAt: string;
    updatedAt: string;
}

export default function ContractViewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [contractData, setContractData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchContract();
    }, []);

    async function fetchContract() {
        try {
            const res = await fetch(`/api/contracts/${params.id}`);
            const data = await res.json();
            setContract(data);

            if (data?.contractData) {
                // Parse contract data
                try {
                    const parsed = JSON.parse(data.contractData);
                    setContractData(parsed);
                } catch (e) {
                    console.error('Error parsing contractData:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching contract:', error);
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            draft: { label: 'Borrador', variant: 'secondary' },
            pending_signature: { label: 'Pendiente Firma', variant: 'outline' },
            signed: { label: 'Firmado', variant: 'default' },
            void: { label: 'Anulado', variant: 'destructive' },
        };

        const config = variants[status] || variants.draft;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    if (loading) {
        return <div className="p-8">Cargando contrato...</div>;
    }

    if (!contract || !contractData) {
        return <div className="p-8">Contrato no encontrado</div>;
    }

    // Determine if it's the new format (with finalContent) or legacy
    const isNewFormat = !!contractData.finalContent;
    const isRestaurantLegacy = !isNewFormat && contractData.nombreRestaurante;

    const renderPDF = () => {
        if (isNewFormat) {
            return <RawTextPDF content={contractData.finalContent} title={contract.title} />;
        }
        if (isRestaurantLegacy) {
            // Restore Date object for legacy restaurant template
            const legacyData = { ...contractData, fechaFirma: new Date(contractData.fechaFirma) };
            return <RestaurantContractPDF data={legacyData} />;
        }
        return null;
    };

    const fileName = contract.title.toLowerCase().replace(/\s+/g, '-') + '.pdf';

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/contratos')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{contract.title}</h1>
                        <p className="text-muted-foreground">
                            Creado el {format(new Date(contract.createdAt), 'dd MMM yyyy', { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {getStatusBadge(contract.status)}
                    {renderPDF() && (
                        <PDFDownloadLink
                            document={renderPDF()!}
                            fileName={fileName}
                        >
                            {({ loading }) => (
                                <Button disabled={loading}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {loading ? 'Generando PDF...' : 'Descargar PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            {/* Contract Content */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Contenido del Contrato</CardTitle>
                        <CardDescription>
                            {isNewFormat ? 'Este texto aparecerá en el PDF final' : 'Vista estructurada (Legacy)'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isNewFormat ? (
                        <div className="bg-muted p-6 rounded-md whitespace-pre-wrap font-mono text-sm leading-relaxed border">
                            {contractData.finalContent}
                        </div>
                    ) : isRestaurantLegacy ? (
                        <div className="space-y-6">
                            {/* Short summary of legacy data */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Cliente:</span> {contractData.nombreContratante}</div>
                                <div><span className="font-medium">Negocio:</span> {contractData.nombreRestaurante}</div>
                                <div><span className="font-medium">Monto:</span> ${contractData.precioTotal}</div>
                            </div>
                            <p className="text-sm italic text-muted-foreground">
                                Este contrato usa una plantilla antigua. Se recomienda descargar el PDF para ver el contenido completo.
                            </p>
                        </div>
                    ) : (
                        <p>No se puede previsualizar el contenido.</p>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push('/contratos')} className="flex-1">
                    Volver al Listado
                </Button>
                {renderPDF() && (
                    <PDFDownloadLink
                        document={renderPDF()!}
                        fileName={fileName}
                        className="flex-1"
                    >
                        {({ loading }) => (
                            <Button disabled={loading} className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                {loading ? 'Generando...' : 'Ver PDF Completo'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}
            </div>
        </div>
    );
}
