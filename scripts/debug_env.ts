
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
console.log('📂 Checking .env.local at:', envPath);
if (fs.existsSync(envPath)) {
    console.log('✅ File exists.');
} else {
    console.log('❌ File NOT found.');
}

dotenv.config({ path: envPath });

const url = process.env.DATABASE_URL;
if (url) {
    console.log('✅ DATABASE_URL loaded:', url.substring(0, 15) + '...');
} else {
    console.log('❌ DATABASE_URL is undefined');
}
