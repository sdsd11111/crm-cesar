
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
} else {
    dotenv.config()
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkLatestTransaction() {
    console.log('🔍 Fetching latest transaction...')
    const { data: tx, error } = await supabase
        .from('transactions')
        .select(`
            id, 
            amount, 
            description, 
            contact_id,
            contacts (
                business_name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('❌ Error:', error.message)
    } else {
        console.log('✅ Latest Transaction:', tx)
        if (tx.contact_id) {
            console.log(`🔗 Linked to Contact ID: ${tx.contact_id}`)
            console.log(`👤 Contact Name (via join): ${tx.contacts?.business_name || 'Unknown'}`)
        } else {
            console.log('⚠️ No contact linked (contact_id is null)')
        }
    }
}

checkLatestTransaction()
