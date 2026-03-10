import { db, schema } from '@/lib/db';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

interface CSVRow {
    'Nombre Comercial': string;
    'Actividad / Modalidad': string;
    'Clasificación': string;
    'Categoría': string;
    'Razón social (Propietario)': string;
    'Provincia': string;
    'Cantón': string;
    'Parroquia': string;
    'Teléfono Principal': string;
    'Teléfono Secundario': string;
    'Correo Electrónico': string;
    'Dirección Web': string;
    'Persona de Contacto': string;
    'Correo Electrónico Persona de Contacto': string;
    'Estado': string;
}

async function importHotelsFromCSV() {
    const csvPath = path.join(process.cwd(), 'docs', 'Base de datos Alojamiento Provincia de Loja.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const results = Papa.parse<CSVRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
    });

    console.log(`📊 Found ${results.data.length} records in CSV`);

    const leads = results.data.map((row) => {
        const businessName = row['Nombre Comercial'] || 'Sin nombre';
        const contactName = row['Persona de Contacto'] || row['Razón social (Propietario)'] || 'Sin contacto';
        const phone = row['Teléfono Principal'] || row['Teléfono Secundario'] || null;
        const phoneSecondary = row['Teléfono Secundario'] || null;
        const email = row['Correo Electrónico Persona de Contacto'] || row['Correo Electrónico'] || null;
        const emailBusiness = row['Correo Electrónico'] || null;
        const city = row['Cantón'] || row['Parroquia'] || null;
        const businessType = row['Clasificación'] || null; // HOTEL, HOSTAL, HOSTERÍA
        const category = row['Categoría'] || null;
        const province = row['Provincia'] || null;
        const parish = row['Parroquia'] || null;
        const website = row['Dirección Web'] || null;
        const owner = row['Razón social (Propietario)'] || null;

        // Crear un objeto con TODAS las columnas en el campo notes (JSON)
        const allData = {
            nombre_comercial: row['Nombre Comercial'],
            actividad_modalidad: row['Actividad / Modalidad'],
            clasificacion: row['Clasificación'],
            categoria: row['Categoría'],
            razon_social: row['Razón social (Propietario)'],
            provincia: row['Provincia'],
            canton: row['Cantón'],
            parroquia: row['Parroquia'],
            telefono_principal: row['Teléfono Principal'],
            telefono_secundario: row['Teléfono Secundario'],
            correo_negocio: row['Correo Electrónico'],
            direccion_web: row['Dirección Web'],
            persona_contacto: row['Persona de Contacto'],
            correo_contacto: row['Correo Electrónico Persona de Contacto'],
            estado_notas: row['Estado'],
        };

        return {
            businessName,
            contactName,
            phone,
            email,
            city,
            businessType,
            businessActivity: `${row['Actividad / Modalidad']} - ${category}`,
            address: parish || null,
            source: 'import',
            outreachStatus: 'new' as const,
            whatsappStatus: 'pending' as const,
            isNewsletterSubscriber: false,
            notes: JSON.stringify(allData, null, 2), // Guardar TODAS las columnas como JSON
        };
    });

    // Insert in batches of 50
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        // @ts-ignore
        await db.insert(schema.leads).values(batch);
        imported += batch.length;
        console.log(`✅ Imported ${imported}/${leads.length} leads`);
    }

    return { total: leads.length, imported };
}

importHotelsFromCSV()
    .then((result) => {
        console.log(`\n🎉 Successfully imported ${result.imported} hotels/hostels with ALL columns!`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error importing:', error);
        process.exit(1);
    });
