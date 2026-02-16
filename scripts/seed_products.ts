
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text, doublePrecision, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import path from 'path';

// Force load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Schema minimal definition for script
const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceId: integer('Source_ID'),
    name: text('Nombre del Producto o Servicio').notNull(),
    price: doublePrecision('Precio'),
    description: text('Descripción'),
    benefits: text('Beneficios'),
    category: text('Categoría para Blog'),
    paymentForm: text('Forma de pago'),
    servicesIncluded: text('Servicios Incluidos (Ejemplo base)'),
});

const productCatalog = [
    // 1. Análisis Estratégico y Estudios de Mercado
    {
        name: "Estrategia Ganar Clientes - Planificación Estratégica de Marketing",
        price: 1550,
        description: "Solución integral que abarca estudio de palabras clave, estrategia de posicionamiento, estudio de competencia y consultoría de negocio. Proporciona una hoja de ruta completa para transformar tu presencia online.",
        benefits: "Visión clara y estratégica, ventaja competitiva, atracción de clientes cualificados, maximización del ROI, implementación efectiva, confianza en decisiones.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Análisis FODA, Análisis de Competencia, Estratégia SEO Local, Plan de Acción para Promoción, Consultoría Personalizada (3 sesiones), Presupuesto y Seguimiento, Manual de Estilo de Branding."
    },
    {
        name: "Análisis de la Competencia - Levantamiento de información",
        price: 600,
        description: "Estudio detallado para anticiparte a los movimientos de tus competidores, identificar sus debilidades y crear una estrategia imbatible basada en datos reales del mercado digital.",
        benefits: "Decisiones con confianza, descubrimiento de oportunidades ocultas, estrategias imbatibles, ahorro de tiempo y dinero.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Radiografía del Mercado Digital, Espionaje Estratégico, Benchmarking Digital, Recomendaciones Claras y Accionables."
    },
    {
        name: "Consultoría Empresarial - Mentoría para iniciar un proyecto",
        price: 250,
        description: "Asesoría para definir el rumbo de tu negocio, crear una visión inspiradora y construir una base sólida. Ideal para quienes se sienten estancados o quieren validar una idea.",
        benefits: "Definición de rumbo, inspiración para equipos, diferenciación en el mercado, negocio sostenible y rentable.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Sesión de descubrimiento (FODA), Definición de Misión y Visión, Propuesta de Valor Única (PVU), Presupuesto y ROI, Estrategia de Marketing Digital."
    },
    {
        name: "Consulta Médica para tu Negocio",
        price: 50,
        description: "Asesoría personalizada rápida para tomar decisiones importantes, ideal para resolver dudas específicas y obtener una guía práctica.",
        benefits: "Claridad y enfoque, soluciones personalizadas, confianza en decisiones.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Sesión de Consultoría Estratégica (60-90 min), Análisis Previo, Recomendaciones Específicas, Seguimiento Estratégico (Consulta online sin costo)."
    },
    {
        name: "El Antes de Endeudarte - Estudio de Factibilidad",
        price: 3500,
        description: "Estudio completo para comprobar la viabilidad de una idea de negocio antes de invertir, útil para presentar en entidades financieras.",
        benefits: "Inversión con números claros, proyecciones financieras como metas, decisiones basadas en estudios.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Estudio de mercado, competencia, palabras clave, análisis financiero, fundamentos de la empresa."
    },
    {
        name: "Procesos Lentos y Caros - Reingeniería de Procesos",
        price: 1500,
        description: "Mapeo y optimización de procesos operativos para reducir costos y mejorar el rendimiento mediante automatización o software a medida.",
        benefits: "Optimización de tiempos, reducción de costos, ahorro en presupuesto operativo.",
        category: "Análisis Estratégico",
        paymentForm: "Pago único",
        servicesIncluded: "Mapeo de procesos, identificación de 'banderas rojas', propuestas de automatización."
    },
    // 2. Diseño Web
    {
        name: "Tu Negocio 24/7 - Página Web",
        price: 360,
        description: "Sitio web de marca diseñado para reflejar la esencia de tu marca. Ideal para emprendedores y negocios.",
        benefits: "Presencia profesional, UX mejorada, personalización, interacción social, seguridad SSL.",
        category: "Diseño Web",
        paymentForm: "Pago único",
        servicesIncluded: "Diseño Premium, hasta 5 secciones, integración redes sociales, galería, blog, formulario contacto, hosting y dominio por 1 año."
    },
    {
        name: "Tu Empresa Online - Página web + Chatbot",
        price: 499,
        description: "Plataforma sólida y escalable con enfoque corporativo.",
        benefits: "Diseño corporativo, secciones estratégicas, herramientas empresariales, seguridad SSL.",
        category: "Diseño Web",
        paymentForm: "Pago único",
        servicesIncluded: "Diseño Premium, hasta 7 secciones (incluye Productos/Equipo), formulario avanzado, blog, integración herramientas, hosting y dominio."
    },
    {
        name: "Tu Sucursal Online - Sitio web + Chatbot (E-commerce)",
        price: 950,
        description: "Sistema de ventas en línea completo para hasta 40 productos.",
        benefits: "Tienda virtual organizada, experiencia de compra fluida, acceso global, gestión de inventario.",
        category: "Diseño Web",
        paymentForm: "Pago único",
        servicesIncluded: "Hasta 7 secciones, multilingüe, 40 productos, carrito, botones de pago, capacitación, mapa, seguridad avanzada."
    },
    {
        name: "Tu Contacto Profesional - Tarjeta Digital",
        price: 60,
        description: "Página web minimalista para primer contacto profesional.",
        benefits: "Diseño intuitivo, adaptable, dominio personalizado.",
        category: "Diseño Web",
        paymentForm: "Pago anual",
        servicesIncluded: "Contacto básico, redes sociales, botón guardar contacto, dominio personalizado."
    },
    {
        name: "Plantillas para Páginas Web",
        price: 50,
        description: "Soluciones rápidas basadas en plantillas (ZAP) para WordPress. Opcional servicio de instalación.",
        benefits: "Ahorro de tiempo, diseño profesional, bajo costo.",
        category: "Diseño Web",
        paymentForm: "Pago único",
        servicesIncluded: "ZAP instalable y video tutorial."
    },
    {
        name: "Páginas web 'GO 2025' - Tu primera página web",
        price: 150,
        description: "Página web estática, sólida y escalable para una presencia rápida.",
        benefits: "Visibilidad online básica y rápida.",
        category: "Diseño Web",
        paymentForm: "Pago único",
        servicesIncluded: "Dominio y hosting 1 año, 3 secciones básicas."
    },
    {
        name: "App para tu Negocio",
        price: 500,
        description: "Desarrollo de aplicación móvil y escritorio a medida.",
        benefits: "Herramientas personalizadas para minimizar procesos.",
        category: "Diseño Web",
        paymentForm: "Pago único (Desde)",
        servicesIncluded: "Desarrollo a medida."
    },
    // 3. Posicionamiento (SEO y Growth)
    {
        name: "Plan para Salir en Google - Estudio de palabras clave",
        price: 1300,
        description: "Estudio para identificar palabras clave estratégicas y crear contenido que posicione.",
        benefits: "Atraer clientes activos, superar competencia, estrategia simplificada.",
        category: "Posicionamiento",
        paymentForm: "Pago único",
        servicesIncluded: "Análisis de hasta 2000 keywords, análisis de competencia, lista organizada, guía de contenido."
    },
    {
        name: "Auditoría SEO y rediseño de un sitio web",
        price: 650,
        description: "Evaluación y rediseño para mejorar visibilidad y conversión.",
        benefits: "Mayor visibilidad Google, atracción clientes calidad, UX irresistible.",
        category: "Posicionamiento",
        paymentForm: "Pago único",
        servicesIncluded: "Auditoría técnica/contenido, rediseño estructura/visual, plan implementación."
    },
    {
        name: "Auditoría Web Automatizada",
        price: 30,
        description: "Informe rápido del estado SEO del sitio.",
        benefits: "Diagnóstico rápido de problemas básicos.",
        category: "Posicionamiento",
        paymentForm: "Pago único",
        servicesIncluded: "Informe automatizado."
    },
    {
        name: "Socio para Crecer - Posicionamiento Web (Alianza)",
        price: 250,
        description: "Alianza estratégica donde OBJETIVO invierte en el desarrollo inicial a cambio de gestión mensual.",
        benefits: "Inversión inicial cero, equipo dedicado, crecimiento medible.",
        category: "Posicionamiento",
        paymentForm: "Pago mensual",
        servicesIncluded: "Desarrollo web, estudio de mercado, gestión mensual SEO/Redes, mantenimiento."
    },
    // 4. Automatización de Procesos
    {
        name: "Ahorra tiempo y dinero automatizando procesos",
        price: 350,
        description: "Implementación de flujos de trabajo automatizados.",
        benefits: "Liberar tiempo, eliminar errores, productividad.",
        category: "Automatización",
        paymentForm: "Pago único",
        servicesIncluded: "Análisis, diseño flujos, apertura cuentas, pruebas, capacitación."
    },
    {
        name: "Asistente 24/7 (Chatbot AI)",
        price: 500,
        description: "Asistente virtual automatizado para atención al cliente.",
        benefits: "Disponibilidad 24/7, ahorro tiempo, consistencia.",
        category: "Automatización",
        paymentForm: "Pago único (Desde)",
        servicesIncluded: "Configuración, integración, flujos conversación."
    },
    {
        name: "Automatización Adicional",
        price: 100,
        description: "Flujos adicionales para optimización continua.",
        benefits: "Mejora continua.",
        category: "Automatización",
        paymentForm: "Pago único",
        servicesIncluded: "Flujos extra."
    }
];

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL missing');

    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log('🚀 Seeding products...');

    // Optional: Clear existing products to prevent duplicates (uncomment if desired)
    // await db.delete(products);

    for (const product of productCatalog) {
        try {
            await db.insert(products).values(product);
            console.log(`✅ Inserted: ${product.name}`);
        } catch (e) {
            console.error(`❌ Failed to insert ${product.name}:`, e);
        }
    }
    console.log('Done.');
    await client.end();
    process.exit(0);
}

main();
