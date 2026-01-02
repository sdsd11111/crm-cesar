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
    console.log('🚀 Ejecutando SQL...');
    await sql`
        CREATE TABLE IF NOT EXISTS "chat_messages"(
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chat_id" text NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "platform" text DEFAULT 'telegram',
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL
);
`;
    console.log('✅ Tabla chat_messages creada exitosamente.');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await sql.end();
  }

  process.exit(0);
}

main().catch(console.error);
