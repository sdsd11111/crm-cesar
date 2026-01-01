const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { db } = require('./lib/db');
const { sql } = require('drizzle-orm');

async function checkSchema() {
    try {
        const tables = ['contacts', 'leads', 'prospects'];
        for (const table of tables) {
            console.log(`--- ${table.toUpperCase()} COLUMNS ---`);
            const results = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${table};`);
            // results is an array of rows directly in this setup
            if (Array.isArray(results)) {
                console.log(results.map(r => r.column_name).join(', '));
            } else if (results && results.rows) {
                console.log(results.rows.map(r => r.column_name).join(', '));
            } else {
                console.log('Unexpected results format:', JSON.stringify(results));
            }
            console.log('\n');
        }
    } catch (e) {
        console.error('Error checking schema:', e);
    } finally {
        process.exit(0);
    }
}

checkSchema();
