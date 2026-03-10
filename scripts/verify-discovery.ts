import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔍 Verificando conexión a Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Presente' : '❌ Faltante');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConnection() {
    try {
        console.log('\n📡 Intentando conectar a Supabase...');

        // Test 1: Verificar si la tabla discovery_leads existe
        const { data, error, count } = await supabase
            .from('discovery_leads')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error al consultar discovery_leads:', error.message);
            console.error('Detalles:', error);

            // Verificar si es un problema de tabla no existente
            if (error.message.includes('does not exist') || error.message.includes('relation')) {
                console.log('\n⚠️  La tabla discovery_leads NO EXISTE en Supabase');
                console.log('📋 Necesitas ejecutar la migración SQL:');
                console.log('   1. Abre Supabase Dashboard');
                console.log('   2. Ve a "SQL Editor"');
                console.log('   3. Ejecuta el archivo: docs/create_full_discovery_schema.sql');
            }
        } else {
            console.log(`✅ Tabla discovery_leads existe`);
            console.log(`📊 Total de registros: ${count || 0}`);
        }

        // Test 2: Verificar si las columnas columna1 y columna2 existen
        const { data: sample, error: sampleError } = await supabase
            .from('discovery_leads')
            .select('id, columna1, columna2')
            .limit(1);

        if (sampleError) {
            if (sampleError.message.includes('columna1') || sampleError.message.includes('columna2')) {
                console.log('\n⚠️  Las columnas columna1 y columna2 NO EXISTEN');
                console.log('📋 Necesitas ejecutar la migración:');
                console.log('   1. Abre Supabase Dashboard');
                console.log('   2. Ve a "SQL Editor"');
                console.log('   3. Ejecuta el archivo: docs/add_discovery_tagging_columns.sql');
            }
        } else {
            console.log('✅ Columnas columna1 y columna2 existen');
        }

    } catch (error: any) {
        console.error('\n❌ Error de conexión:', error.message);

        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('\n🔧 PROBLEMA DE DNS/CONEXIÓN:');
            console.log('   - Tu internet funciona (estoy conectado)');
            console.log('   - Pero no puedes resolver db.sxsdmjpaqgmpmvozoicj.supabase.co');
            console.log('\n💡 Posibles soluciones:');
            console.log('   1. Verifica tu firewall/antivirus');
            console.log('   2. Cambia tu DNS a 8.8.8.8 (Google DNS)');
            console.log('   3. Prueba con VPN');
            console.log('   4. Verifica que la URL de Supabase sea correcta en .env.local');
        }
    }
}

verifyConnection();
