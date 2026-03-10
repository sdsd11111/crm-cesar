
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local immediately
const result = dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (result.error) {
    console.warn('⚠️ Could not load .env.local');
} else {
    // console.log('✅ Environment loaded from .env.local');
}
