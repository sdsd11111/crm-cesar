import { whatsappService } from '../lib/whatsapp/WhatsAppService';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('🚀 Uploading Carnaval 2026 Video to Meta...');

    const filePath = path.join(process.cwd(), 'docs', 'Camm_carnaval_2026', 'WhatsApp Video 2026-02-02 at 10.33.43 PM.mp4');

    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Upload
    const result = await whatsappService.uploadMedia(
        fileBuffer,
        'carnaval_video.mp4',
        'video/mp4',
        'video'
    );

    if (result.success) {
        console.log('\n✅ UPLOAD SUCCESSFUL!');
        console.log('------------------------------------------------');
        console.log(`MEDIA_ID: ${result.mediaId}`);
        console.log('------------------------------------------------');
        console.log('👉 Copy this ID and paste it into CortexRouterService.ts');
    } else {
        console.error('❌ Upload Failed:', result.error);
    }
}

main();
