
import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const host = 'aws-1-us-east-1.pooler.supabase.com';
const user = 'postgres.sxsdmjpaqgmpmvozoicj';
const password = 'VhTQvB608MDLHoHs';

console.log('🔗 Probando Pooler sugerido por Dashboard (aws-1)...');
console.log(`URL: postgresql://${user}:****@${host}:6543/postgres`);

const sql = postgres({
    host,
    port: 6543,
    database: 'postgres',
    username: user,
    password,
    connect_timeout: 10,
    ssl: 'require'
});

async function test() {
    try {
        const result = await sql`SELECT count(*) FROM discovery_leads`;
        console.log('✅ Conexión exitosa!');
        console.log('📊 Resultado:', result);
    } catch (error: any) {
        console.error('❌ Error de conexión:', error.message);
        console.error('Código:', error.code);
        console.error('Syscall:', error.syscall);
    } finally {
        await sql.end();
    }
}

test();
