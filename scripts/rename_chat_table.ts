import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL no encontrada en .env.local');
        process.exit(1);
    }

    console.log(`🔌 Conectando a: ${dbUrl.substring(0, 15)}...`);

    const sql = postgres(dbUrl, { max: 1 });

    try {
        console.log('🗑️ Eliminando tabla antigua (chat_messages)...');
        await sql`DROP TABLE IF EXISTS "chat_messages";`;

        console.log('🚀 Creando tabla nueva (donna_chat_messages)...');
        await sql`
        CREATE TABLE IF NOT EXISTS "donna_chat_messages" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "chat_id" text NOT NULL,
          "role" text NOT NULL,
          "content" text NOT NULL,
          "platform" text DEFAULT 'telegram',
          "metadata" jsonb DEFAULT '{}',
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `;

        console.log('🔒 Habilitando RLS (Row Level Security)...');
        await sql`ALTER TABLE "donna_chat_messages" ENABLE ROW LEVEL SECURITY;`;

        // Crear una política permisiva por ahora para evitar bloqueos si se usa PostgREST,
        // aunque el backend node usa conexión directa.
        await sql`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_catalog.pg_policies 
                WHERE tablename = 'donna_chat_messages' AND policyname = 'allow_all'
            ) THEN
                CREATE POLICY "allow_all" ON "donna_chat_messages" FOR ALL USING (true);
            END IF;
        END $$;
      `;

        console.log('✅ Tabla donna_chat_messages configurada exitosamente con RLS.');
    } catch (error) {
        console.error('❌ Error en migración:', error);
    } finally {
        await sql.end();
    }

    process.exit(0);
}

main().catch(console.error);
