export type PlanType = 'PRO' | 'ELITE' | 'IMPERIO';

export interface ContractVariables {
    // Datos de firma y lugar
    CIUDAD_FIRMA: string;
    DIA_FIRMA: string;
    MES_FIRMA: string;
    ANIO_FIRMA: string;

    // Datos del contratante
    NOMBRE_CONTRATANTE: string;
    CEDULA_CONTRATANTE: string;
    CALIDAD_CONTRATANTE: string; // e.g. "Propietario", "Gerente"
    NOMBRE_NEGOCIO: string;
    // CIUDAD_NEGOCIO y PROVINCIA_NEGOCIO removidos de "Unique list" pero usados en texto base.
    // Los dejaremos como opcionales o los inferiremos.
    CIUDAD_NEGOCIO?: string;
    PROVINCIA_NEGOCIO?: string;

    // Si la nueva lista usa DOMICILIO para todo:
    DOMICILIO_CONTRATANTE: string;

    // Datos del contratista
    NOMBRE_CONTRATISTA: string;
    RUC_CONTRATISTA: string;
    DOMICILIO_CONTRATISTA: string;
    PROFESION_CONTRATISTA?: string; // Opcional en nueva lista

    // Datos del servicio
    // TIPO_SERVICIO y NOMBRE_PLAN se pueden derivar del PlanType si no se proveen
    TIPO_SERVICIO?: string;
    NOMBRE_PLAN?: string;
    FECHA_ENTREGA: string; // Fecha formateada

    // Valores económicos
    VALOR_TOTAL: string;
    VALOR_TOTAL_LETRAS?: string; // Derivado o input manual
    PORCENTAJE_ANTICIPO?: string; // Derivado
    VALOR_ANTICIPO?: string;
    PORCENTAJE_SALDO?: string;
    VALOR_SALDO?: string;

    // Variables internas config
    TITULO_CONTRATO?: string;
    SUBTITULO_CONTRATO?: string;

    // Condiciones operativas
    HORAS_CAPACITACION?: string; // Hardcoded per plan?
    DIAS_SOPORTE?: string; // Hardcoded per plan?
    DIAS_PREAVISO?: string;
    CIUDAD_JURISDICCION: string;
}
