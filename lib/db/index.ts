import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connectionString = process.env.DATABASE_URL!;

// For direct connection (port 5432) or PGBouncer (6543)
const client = postgres(connectionString, { prepare: false });

export * as schema from './schema';
export const db = drizzle(client, { schema });
