import { ContractVariables, PlanType } from './types';
import { getHotelContract, CONTRACT_VARIABLE_OPTS as HOTEL_OPTS } from './hotel';
import { type RestaurantContractData } from '@/lib/contracts/restaurant-schema';

export interface TemplateField {
    id: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'select' | 'list';
    options?: { label: string; value: string }[];
    defaultValue?: any;
    placeholder?: string;
    required?: boolean;
}

export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    fields: TemplateField[];
    generate: (variables: any, options?: any) => string;
}

export const CONTRACT_TEMPLATES: Record<string, ContractTemplate> = {
    hotel: {
        id: 'hotel',
        name: 'Sistema de Reservas (Hoteles/Hospedajes)',
        description: 'Contrato profesional para implementación de sistema de reservas y desarrollo web.',
        fields: [
            { id: 'CIUDAD_FIRMA', label: 'Ciudad de Firma', type: 'string', defaultValue: 'Loja', required: true },
            { id: 'DIA_FIRMA', label: 'Día de Firma', type: 'string', required: true },
            { id: 'MES_FIRMA', label: 'Mes de Firma', type: 'string', required: true },
            { id: 'ANIO_FIRMA', label: 'Año de Firma', type: 'string', defaultValue: new Date().getFullYear().toString(), required: true },
            { id: 'NOMBRE_CONTRATANTE', label: 'Nombre del Contratante', type: 'string', required: true },
            { id: 'CEDULA_CONTRATANTE', label: 'Cédula/ID Contratante', type: 'string', required: true },
            { id: 'CALIDAD_CONTRATANTE', label: 'Calidad (Dueño/Gerente)', type: 'string', defaultValue: 'Propietario', required: true },
            { id: 'NOMBRE_NEGOCIO', label: 'Nombre del Negocio', type: 'string', required: true },
            { id: 'DOMICILIO_CONTRATANTE', label: 'Domicilio Contratante', type: 'string', required: true },
            { id: 'FECHA_ENTREGA', label: 'Fecha Máxima Entrega', type: 'string', required: true },
            { id: 'VALOR_TOTAL', label: 'Precio Total (USD)', type: 'number', required: true },
            { id: 'VALOR_TOTAL_LETRAS', label: 'Precio en Letras', type: 'string', required: true },
            { id: 'PORCENTAJE_ANTICIPO', label: '% Anticipo', type: 'number', defaultValue: 50, required: true },
            { id: 'CIUDAD_JURISDICCION', label: 'Ciudad Jurisdicción', type: 'string', defaultValue: 'Loja', required: true },
            {
                id: 'PLAN',
                label: 'Plan del Servicio',
                type: 'select',
                defaultValue: 'PRO',
                options: [
                    { label: 'PLAN PRO', value: 'PRO' },
                    { label: 'PLAN ÉLITE', value: 'ELITE' },
                    { label: 'PLAN IMPERIO', value: 'IMPERIO' }
                ],
                required: true
            },
        ],
        generate: (vars) => {
            const plan = vars.PLAN as PlanType;
            // Calculate derived fields if possible
            const total = parseFloat(vars.VALOR_TOTAL);
            const pctAnticipo = parseFloat(vars.PORCENTAJE_ANTICIPO);
            const anticipo = (total * (pctAnticipo / 100)).toFixed(2);
            const saldo = (total - parseFloat(anticipo)).toFixed(2);
            const pctSaldo = 100 - pctAnticipo;

            return getHotelContract({
                ...vars,
                VALOR_ANTICIPO: anticipo,
                VALOR_SALDO: saldo,
                PORCENTAJE_SALDO: pctSaldo.toString(),
            }, plan);
        }
    },
    restaurant: {
        id: 'restaurant',
        name: 'Sitio Web Restaurante (Simplificado)',
        description: 'Contrato enfocado en presencia digital para restaurantes con menú y platos destacados.',
        fields: [
            // Simplified for now based on the existing restaurant schema but adapted to this generic flow
            { id: 'ciudad', label: 'Ciudad de Firma', type: 'string', defaultValue: 'Loja', required: true },
            { id: 'fechaFirma', label: 'Fecha de Firma', type: 'date', required: true },
            { id: 'nombreContratante', label: 'Nombre del Contratante', type: 'string', required: true },
            { id: 'tipoIdentificacion', label: 'Tipo ID', type: 'select', options: [{ label: 'Cédula', value: 'Cédula' }, { label: 'RUC', value: 'RUC' }], defaultValue: 'Cédula' },
            { id: 'numeroIdentificacion', label: 'Núm. Identificación', type: 'string', required: true },
            { id: 'nombreRestaurante', label: 'Nombre Restaurante', type: 'string', required: true },
            { id: 'dominioWeb', label: 'Dominio Web', type: 'string', placeholder: 'www.ejemplo.com', required: true },
            { id: 'precioTotal', label: 'Precio Total (USD)', type: 'number', required: true },
            { id: 'anticipo', label: 'Anticipo (USD)', type: 'number', required: true },
            { id: 'plazoDias', label: 'Plazo (Días Hábiles)', type: 'number', defaultValue: 5, required: true },
        ],
        generate: (vars) => {
            // Note: The restaurant template uses a different logic (it has its own PDF component).
            // For unified editing, we should ideally have a text generator for restaurant too.
            // I'll add a simple text generator for restaurants later or adapt the current flow.
            return `CONTRATO PARA RESTAURANTE: ${vars.nombreRestaurante}\n\nEste es un borrador autogenerado...`;
        }
    }
}
