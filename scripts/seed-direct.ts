import { createClient } from '@libsql/client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const mockLeads = [
    {
        businessName: "Restaurante El Sabor Lojano",
        contactName: "María Gonzalez",
        phone: "0991234567",
        email: "maria@elsaborlojano.com",
        city: "Loja",
        businessActivity: "Gastronomía Típica",
        personalityType: "Emocional Extrovertido",
        facebookFollowers: 1200,
        specificRecognitions: "Mejor Repe 2024",
        interestedProduct: JSON.stringify(["Página Web", "Manejo de Redes"]),
        notes: "Lead de prueba 1"
    },
    {
        businessName: "Hotel Gran Victoria",
        contactName: "Roberto Carlos",
        phone: "0987654321",
        email: "gerencia@granvictoria.com",
        city: "Loja",
        businessActivity: "Hotelería",
        personalityType: "Lógico Introvertido",
        facebookFollowers: 5000,
        specificRecognitions: "Certificación Calidad Turística",
        interestedProduct: JSON.stringify(["Sistema de Reservas", "SEO"]),
        notes: "Lead de prueba 2"
    },
    {
        businessName: "Cafetería Aroma y Café",
        contactName: "Lucía Mendez",
        phone: "0998877665",
        email: "lucia@aromaycafe.com",
        city: "Loja",
        businessActivity: "Cafetería",
        personalityType: "Emocional Introvertido",
        facebookFollowers: 850,
        specificRecognitions: "Mejor Café de Especialidad",
        interestedProduct: JSON.stringify(["Menú Digital", "Publicidad"]),
        notes: "Lead de prueba 3"
    },
    {
        businessName: "Pizzería La Bella Italia",
        contactName: "Marco Rossi",
        phone: "0991122334",
        email: "marco@labellaitalia.com",
        city: "Loja",
        businessActivity: "Pizzería",
        personalityType: "Lógico Extrovertido",
        facebookFollowers: 3200,
        specificRecognitions: "Top 3 Pizzerías TripAdvisor",
        interestedProduct: JSON.stringify(["App de Pedidos", "Branding"]),
        notes: "Lead de prueba 4"
    },
    {
        businessName: "Hostal El Descanso",
        contactName: "Fernando Torres",
        phone: "0985544332",
        email: "info@eldescanso.com",
        city: "Vilcabamba",
        businessActivity: "Hostal",
        personalityType: "Amigable",
        facebookFollowers: 1500,
        specificRecognitions: "Recomendado por Lonely Planet",
        interestedProduct: JSON.stringify(["Web Multilingüe", "Video Marketing"]),
        notes: "Lead de prueba 5"
    }
];

async function seed() {
    const dbPath = path.join(process.cwd(), 'data', 'crm.db');
    const client = createClient({
        url: `file:${dbPath}`,
    });

    console.log('🌱 Seeding mock leads via SQL...');

    for (const lead of mockLeads) {
        const id = uuidv4();
        const now = Date.now();

        try {
            await client.execute({
                sql: `INSERT INTO leads (
                id, business_name, contact_name, phone, email, city, 
                business_activity, personality_type, facebook_followers, 
                specific_recognitions, interested_product, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    id,
                    lead.businessName,
                    lead.contactName,
                    lead.phone,
                    lead.email,
                    lead.city,
                    lead.businessActivity,
                    lead.personalityType,
                    lead.facebookFollowers,
                    lead.specificRecognitions,
                    lead.interestedProduct,
                    lead.notes,
                    now,
                    now
                ]
            });
            console.log(`✅ Created: ${lead.businessName}`);
        } catch (e) {
            console.error(`❌ Failed: ${lead.businessName} - ${e.message}`);
        }
    }

    console.log('🏁 Seeding finished.');
    client.close();
}

seed().catch(console.error);
