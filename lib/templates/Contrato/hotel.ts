import { ContractVariables, PlanType } from './types';

const HEADER_TEMPLATE = `# {{TITULO_CONTRATO}}

{{SUBTITULO_CONTRATO}}

En la ciudad de **{{CIUDAD_FIRMA}}**, a los **{{DIA_FIRMA}}** días del mes de **{{MES_FIRMA}}** del año **{{ANIO_FIRMA}}**, comparecen libre y voluntariamente a la celebración del presente **CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES**, por una parte **{{NOMBRE_CONTRATANTE}}**, portador de la cédula de identidad N.° **{{CEDULA_CONTRATANTE}}**, en calidad de **{{CALIDAD_CONTRATANTE}}** del establecimiento **{{NOMBRE_NEGOCIO}}**, ubicado en **{{CIUDAD_NEGOCIO}}**, provincia de **{{PROVINCIA_NEGOCIO}}**, con domicilio en **{{DOMICILIO_CONTRATANTE}}**, a quien en adelante se denominará **EL CONTRATANTE**; y por otra parte **{{NOMBRE_CONTRATISTA}}**, con RUC N.° **{{RUC_CONTRATISTA}}**, con domicilio en **{{DOMICILIO_CONTRATISTA}}**, en calidad de **{{PROFESION_CONTRATISTA}}**, a quien en adelante se denominará **EL CONTRATISTA**; quienes convienen libremente en celebrar el presente contrato, al tenor de las siguientes cláusulas:

---

`;

const CLAUSE_1_PRO = `## PRIMERA – OBJETO Y ALCANCE

EL CONTRATISTA se obliga a prestar a favor de EL CONTRATANTE servicios profesionales de **{{TIPO_SERVICIO}}**, conforme a las especificaciones técnicas, funcionalidades y condiciones detalladas en el **ANEXO TÉCNICO – {{NOMBRE_PLAN}}**, el mismo que forma parte integrante e inseparable del presente contrato.
`;

const CLAUSE_1_ELITE = `## PRIMERA – OBJETO Y ALCANCE

EL CONTRATISTA desarrollará un sitio web profesional multilingüe, sistema de reservas automatizado y estrategia de posicionamiento, conforme al ANEXO TÉCNICO – PLAN ÉLITE, que incluye:

*   Hasta 15 páginas profesionales.
*   Estudio de palabras clave locales y turísticas.
*   Redacción e integración de 5 artículos optimizados para SEO.
*   Optimización avanzada en Google Search Console.
*   Integración y optimización de Google My Business.
*   Panel administrativo completo.
`;

const CLAUSE_1_IMPERIO = `## PRIMERA – OBJETO Y ALCANCE

EL CONTRATISTA desarrollará un ecosistema digital completo para EL CONTRATANTE, conforme al ANEXO TÉCNICO – PLAN IMPERIO, que incluye:

*   Hasta 20 páginas profesionales.
*   Estudio profundo de palabras clave locales y regionales.
*   Redacción e integración de 10 artículos de autoridad SEO.
*   Estrategia avanzada de posicionamiento en buscadores y asistentes de IA.
*   Informes mensuales de rendimiento.
*   Consultoría estratégica especializada.
*   Sistema de reservas avanzado y panel administrativo total.
`;

const BODY_TEMPLATE = `
---

## SEGUNDA – PLAZO Y ENTREGA

El plazo máximo para la ejecución y entrega del proyecto será hasta el **{{FECHA_ENTREGA}}**, contado a partir de la concurrencia conjunta de los siguientes eventos: (i) la firma del presente contrato, (ii) el pago del anticipo establecido, y (iii) la entrega completa de la información, materiales y contenidos requeridos por parte de EL CONTRATANTE.
El plazo se suspenderá y extenderá automáticamente en caso de retrasos imputables a EL CONTRATANTE, sin que ello constituya incumplimiento de EL CONTRATISTA.

---

## TERCERA – VALOR DEL CONTRATO Y FORMA DE PAGO

El valor total del presente contrato asciende a la suma de **USD {{VALOR_TOTAL}}** ({{VALOR_TOTAL_LETRAS}}), más el Impuesto al Valor Agregado (IVA).
EL CONTRATANTE pagará dicho valor de la siguiente manera: un anticipo equivalente al **{{PORCENTAJE_ANTICIPO}}%**, correspondiente a **USD {{VALOR_ANTICIPO}} + IVA**, a la firma del contrato; y el saldo restante equivalente al **{{PORCENTAJE_SALDO}}%**, correspondiente a **USD {{VALOR_SALDO}} + IVA**, contra la entrega final del proyecto.
EL CONTRATISTA emitirá la factura electrónica correspondiente por cada pago recibido.

---

## CUARTA – OBLIGACIONES DE EL CONTRATANTE

EL CONTRATANTE se obliga a entregar oportunamente la información y materiales requeridos, revisar avances en los plazos acordados, proporcionar credenciales o enlaces necesarios para integraciones, cumplir con los pagos pactados y asistir a la capacitación programada.

---

## QUINTA – OBLIGACIONES DE EL CONTRATISTA

EL CONTRATISTA se obliga a ejecutar los servicios con diligencia profesional, entregar el proyecto conforme al ANEXO TÉCNICO, proporcionar capacitación por **{{HORAS_CAPACITACION}} hora(s)**, entregar accesos administrativos completos y brindar soporte técnico por **{{DIAS_SOPORTE}} días** posteriores a la entrega.

---

## SEXTA – NO GARANTÍA DE RESULTADOS

EL CONTRATANTE reconoce que EL CONTRATISTA no garantiza resultados específicos en posicionamiento, tráfico, ventas, reservas, ingresos económicos o visibilidad en buscadores o asistentes de inteligencia artificial, por depender de factores externos ajenos a su control.

---

## SÉPTIMA – RESPONSABILIDAD LIMITADA

La responsabilidad máxima de EL CONTRATISTA se limita al valor total efectivamente pagado por EL CONTRATANTE en virtud del presente contrato. Se excluye expresamente la responsabilidad por lucro cesante, daños indirectos o fallas de servicios de terceros.

---

## OCTAVA – SERVICIOS DE TERCEROS

EL CONTRATANTE acepta que el funcionamiento del proyecto depende de servicios de terceros (hosting, dominios, Google, WhatsApp, pasarelas de pago, entre otros), por lo que EL CONTRATISTA no responde por interrupciones, cambios de políticas o discontinuación de dichos servicios.

---

## NOVENA – FUERZA MAYOR O CASO FORTUITO

Ninguna de las partes será responsable por incumplimientos derivados de fuerza mayor o caso fortuito conforme a la legislación ecuatoriana. El plazo contractual se suspenderá mientras dure el evento.

---

## DÉCIMA – SOPORTE Y MANTENIMIENTO

EL CONTRATISTA brindará soporte técnico por **{{DIAS_SOPORTE}} días** posteriores a la entrega. El mantenimiento posterior será opcional y se regirá por las condiciones del ANEXO TÉCNICO.

---

## DÉCIMA PRIMERA – PROPIEDAD INTELECTUAL

Una vez cancelado el valor total del contrato, EL CONTRATANTE adquiere la propiedad del contenido personalizado y una licencia de uso exclusiva del diseño específico. EL CONTRATISTA conservará la propiedad intelectual sobre componentes técnicos reutilizables.

---

## DÉCIMA SEGUNDA – CONFIDENCIALIDAD

Las partes se obligan a mantener confidencial toda información sensible a la que tengan acceso con ocasión del presente contrato.

---

## DÉCIMA TERCERA – TERMINACIÓN ANTICIPADA

El contrato podrá terminarse por mutuo acuerdo, incumplimiento grave o decisión unilateral con notificación previa de **{{DIAS_PREAVISO}} días hábiles**. No habrá devolución de valores pagados. Cualquier pago proporcional adicional requerirá acuerdo expreso y por escrito.

---

## DÉCIMA CUARTA – JURISDICCIÓN

Para todos los efectos legales, las partes se someten a las leyes de la República del Ecuador y a la jurisdicción de los jueces competentes de **{{CIUDAD_JURISDICCION}}**.

---

### FIRMAN:

**EL CONTRATANTE**
{{NOMBRE_CONTRATANTE}}

**EL CONTRATISTA**
{{NOMBRE_CONTRATISTA}}
`;

const PLAN_CONFIG = {
    PRO: {
        title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES',
        subtitle: 'Desarrollo Web y Sistema de Reservas',
        clause1: CLAUSE_1_PRO,
        defaultService: 'Desarrollo Web',
        hoursTraining: '4',
        daysSupport: '30'
    },
    ELITE: {
        title: '📗 CONTRATO – PLAN ÉLITE',
        subtitle: 'Desarrollo Web y Sistema de Reservas – PLAN ÉLITE',
        clause1: CLAUSE_1_ELITE,
        defaultService: 'Desarrollo Web Élite',
        hoursTraining: '8', // Asumido mayor
        daysSupport: '60' // Asumido mayor
    },
    IMPERIO: {
        title: '📕 CONTRATO – PLAN IMPERIO',
        subtitle: 'Desarrollo Web y Sistema de Reservas – PLAN IMPERIO',
        clause1: CLAUSE_1_IMPERIO,
        defaultService: 'Ecosistema Digital Imperio',
        hoursTraining: '12', // Asumido mayor
        daysSupport: '90' // Asumido mayor
    }
};

export function getHotelContract(variables: ContractVariables, plan: PlanType = 'PRO'): string {
    const config = PLAN_CONFIG[plan];

    // Preparar el template completo
    let fullTemplate = HEADER_TEMPLATE + config.clause1 + BODY_TEMPLATE;

    // Rellenar defaults si faltan
    const finalVariables = { ...variables };
    if (!finalVariables.TITULO_CONTRATO) finalVariables.TITULO_CONTRATO = config.title;
    if (!finalVariables.SUBTITULO_CONTRATO) finalVariables.SUBTITULO_CONTRATO = config.subtitle;
    if (!finalVariables.TIPO_SERVICIO) finalVariables.TIPO_SERVICIO = config.defaultService;
    if (!finalVariables.NOMBRE_PLAN) finalVariables.NOMBRE_PLAN = `PLAN ${plan}`;
    if (!finalVariables.HORAS_CAPACITACION) finalVariables.HORAS_CAPACITACION = config.hoursTraining;
    if (!finalVariables.DIAS_SOPORTE) finalVariables.DIAS_SOPORTE = config.daysSupport;
    if (!finalVariables.DIAS_PREAVISO) finalVariables.DIAS_PREAVISO = '15'; // Default standard

    // Defaults para campos geográficos si faltan (Fallback a la ciudad de firma si es razonable, o vacio)
    if (!finalVariables.CIUDAD_NEGOCIO) finalVariables.CIUDAD_NEGOCIO = finalVariables.CIUDAD_FIRMA || '((CIUDAD_NEGOCIO))';
    if (!finalVariables.PROVINCIA_NEGOCIO) finalVariables.PROVINCIA_NEGOCIO = '((PROVINCIA_NEGOCIO))';
    if (!finalVariables.NOMBRE_CONTRATISTA) finalVariables.NOMBRE_CONTRATISTA = 'CÉSAR REYES';
    if (!finalVariables.RUC_CONTRATISTA) finalVariables.RUC_CONTRATISTA = '1103421531001';
    if (!finalVariables.DOMICILIO_CONTRATISTA) finalVariables.DOMICILIO_CONTRATISTA = 'Loja, Ecuador';
    if (!finalVariables.PROFESION_CONTRATISTA) finalVariables.PROFESION_CONTRATISTA = 'Consultor Tecnológico';

    // Rellenar variables
    for (const key in finalVariables) {
        // @ts-ignore
        const value = finalVariables[key];
        const regex = new RegExp(`{{${key}}}`, 'g');
        fullTemplate = fullTemplate.replace(regex, value);
    }

    // Variables adicionales inyectadas por config (Titulo/Subtitulo no estaban en ContractVariables explicito pero se usan)
    fullTemplate = fullTemplate.replace(/{{TITULO_CONTRATO}}/g, config.title);
    fullTemplate = fullTemplate.replace(/{{SUBTITULO_CONTRATO}}/g, config.subtitle);

    return fullTemplate;
}

export const CONTRACT_VARIABLE_OPTS = [
    { label: "Ciudad Firma", value: "CIUDAD_FIRMA" },
    { label: "Día Firma", value: "DIA_FIRMA" },
    { label: "Mes Firma", value: "MES_FIRMA" },
    { label: "Año Firma", value: "ANIO_FIRMA" },
    { label: "Nombre Contratante", value: "NOMBRE_CONTRATANTE" },
    { label: "Cédula Contratante", value: "CEDULA_CONTRATANTE" },
    { label: "Calidad Contratante (Gerente/Dueño)", value: "CALIDAD_CONTRATANTE" },
    { label: "Nombre Negocio", value: "NOMBRE_NEGOCIO" },
    { label: "Domicilio Contratante", value: "DOMICILIO_CONTRATANTE" },
    { label: "Nombre Contratista", value: "NOMBRE_CONTRATISTA" },
    { label: "RUC Contratista", value: "RUC_CONTRATISTA" },
    { label: "Domicilio Contratista", value: "DOMICILIO_CONTRATISTA" },
    { label: "Fecha Entrega", value: "FECHA_ENTREGA" },
    { label: "Valor Total (USD)", value: "VALOR_TOTAL" },
    { label: "Ciudad Jurisdicción", value: "CIUDAD_JURISDICCION" },
];
