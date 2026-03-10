const mockLeads = [
    {
        business_name: "Restaurante El Sabor Lojano",
        contact_name: "María Gonzalez",
        phone: "0991234567",
        email: "maria@elsaborlojano.com",
        city: "Loja",
        business_activity: "Gastronomía Típica",
        personality_type: "Emocional Extrovertido",
        facebook_followers: 1200,
        specific_recognitions: "Mejor Repe 2024",
        interested_product: JSON.stringify(["Página Web", "Manejo de Redes"]),
        notes: "Lead de prueba 1"
    },
    {
        business_name: "Hotel Gran Victoria",
        contact_name: "Roberto Carlos",
        phone: "0987654321",
        email: "gerencia@granvictoria.com",
        city: "Loja",
        business_activity: "Hotelería",
        personality_type: "Lógico Introvertido",
        facebook_followers: 5000,
        specific_recognitions: "Certificación Calidad Turística",
        interested_product: JSON.stringify(["Sistema de Reservas", "SEO"]),
        notes: "Lead de prueba 2"
    },
    {
        business_name: "Cafetería Aroma y Café",
        contact_name: "Lucía Mendez",
        phone: "0998877665",
        email: "lucia@aromaycafe.com",
        city: "Loja",
        business_activity: "Cafetería",
        personality_type: "Emocional Introvertido",
        facebook_followers: 850,
        specific_recognitions: "Mejor Café de Especialidad",
        interested_product: JSON.stringify(["Menú Digital", "Publicidad"]),
        notes: "Lead de prueba 3"
    },
    {
        business_name: "Pizzería La Bella Italia",
        contact_name: "Marco Rossi",
        phone: "0991122334",
        email: "marco@labellaitalia.com",
        city: "Loja",
        business_activity: "Pizzería",
        personality_type: "Lógico Extrovertido",
        facebook_followers: 3200,
        specific_recognitions: "Top 3 Pizzerías TripAdvisor",
        interested_product: JSON.stringify(["App de Pedidos", "Branding"]),
        notes: "Lead de prueba 4"
    },
    {
        business_name: "Hostal El Descanso",
        contact_name: "Fernando Torres",
        phone: "0985544332",
        email: "info@eldescanso.com",
        city: "Vilcabamba",
        business_activity: "Hostal",
        personality_type: "Amigable",
        facebook_followers: 1500,
        specific_recognitions: "Recomendado por Lonely Planet",
        interested_product: JSON.stringify(["Web Multilingüe", "Video Marketing"]),
        notes: "Lead de prueba 5"
    }
];

async function seed() {
    console.log('🌱 Seeding mock leads via API...');
    console.log('Payload sample:', JSON.stringify(mockLeads[0]));

    for (const lead of mockLeads) {
        try {
            const response = await fetch('http://localhost:3000/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead)
            });

            if (response.ok) {
                console.log(`✅ Created: ${lead.business_name}`);
            } else {
                console.error(`❌ Failed: ${lead.business_name} - ${await response.text()}`);
            }
        } catch (e) {
            console.error(`❌ Connection Error: ${e.message}`);
        }
    }

    console.log('🏁 Seeding finished.');
}

seed();
