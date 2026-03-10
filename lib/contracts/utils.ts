export function fillTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
}

export function calculateDerivedFields(templateSlug: string, variables: Record<string, any>): Record<string, any> {
    const derived = { ...variables };

    if (templateSlug === 'hotel') {
        const total = parseFloat(variables.VALOR_TOTAL || '0');
        const pctAnticipo = parseFloat(variables.PORCENTAJE_ANTICIPO || '50');
        const anticipo = (total * (pctAnticipo / 100)).toFixed(2);
        const saldo = (total - parseFloat(anticipo)).toFixed(2);
        const pctSaldo = 100 - pctAnticipo;

        derived.VALOR_ANTICIPO = anticipo;
        derived.VALOR_SALDO = saldo;
        derived.PORCENTAJE_SALDO = pctSaldo.toString();

        // Add other defaults if missing
        if (!derived.NOMBRE_CONTRATISTA) derived.NOMBRE_CONTRATISTA = 'CÉSAR REYES';
        if (!derived.RUC_CONTRATISTA) derived.RUC_CONTRATISTA = '1103421531001';
        if (!derived.TITULO_CONTRATO) derived.TITULO_CONTRATO = 'CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES';
    }

    return derived;
}
