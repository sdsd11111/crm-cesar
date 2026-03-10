
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
    }
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function auditDatabase() {
    console.log('🔍 Starting Database Audit...')

    // Check Transactions Table indexes
    const { data: indexData, error: indexError } = await supabase.rpc('get_indexes', { table_name: 'transactions' });

    // Fallback if RPC doesn't exist (likely given permissions), define expected columns
    const { data: columns, error: colError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

    if (colError) console.error('❌ Error assessing transactions table:', colError.message);
    else console.log('✅ Transactions table accessible. Columns detected:', Object.keys(columns?.[0] || {}));

    // Check for contact_id population
    const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .is('contact_id', null);

    if (countError) console.error('❌ Error counting null contact_ids:', countError.message);
    else console.log(`⚠️ Legacy Data Risk: ${count} transactions have NULL contact_id (These will disappear from client-filtered views).`);

    console.log('Audit Complete.');
}

auditDatabase()
