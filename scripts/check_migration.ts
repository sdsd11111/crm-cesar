
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Try to manually read .env.local if standard config fails
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
} else {
    dotenv.config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: ENV variables not found')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    console.log('🚀 Checking and applying migrations...')

    // 1. Add sub_type
    console.log('🔹 Adding column: sub_type')
    const { error: err1 } = await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sub_type text;`
    })
    // If RPC not enabled, try raw query via special generic function if it exists, or just direct SQL if user has privileges?
    // Supabase-js client doesn't support generic SQL execution directly without a configured RPC function.
    // However, we can try to "create" the column via a dummy Postgres function if we had dashboard access, but here we only have the key.

    // BETTER APPROACH: Since we might not have a general 'exec_sql' RPC, we will try to just run the SQL commands by reading the file and assuming the user has the 'postgres' generic query RPC set up, OR we will fail and tell the user they must run the SQL manually.

    // BUT! I suspect the user DOES NOT have `exec_sql`.
    // Let's try to infer if columns exist by selecting them.

    const { error: selectError } = await supabase.from('transactions').select('sub_type, contact_id, payment_method, parent_transaction_id').limit(1)

    if (selectError) {
        console.error('❌ Columns likely missing. Error:', selectError.message)
        console.log('⚠️  YOU MUST RUN THE MIGRATION SQL MANUALLY.')
        console.log('Please copy content of scripts/012_finance_expansion.sql and run it in Supabase SQL Editor.')
    } else {
        console.log('✅ Columns seem to exist!')
    }
}

// Since we can't easily run DDL (CREATE/ALTER) from supabase-js without an RPC, 
// I will output the SQL the user needs to run if detection fails.
runMigration()
