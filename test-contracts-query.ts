import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { db } from './lib/db';
import * as schema from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString, { prepare: false, ssl: 'require' });
    const localDb = drizzle(client, { schema });

    try {
        console.log('Fetching contracts with SSL...');
        const contracts = await localDb
            .select({
                id: schema.contracts.id,
                clientId: schema.contracts.clientId,
                title: schema.contracts.title,
                status: schema.contracts.status,
                clientName: schema.clients.businessName,
            })
            .from(schema.contracts)
            .leftJoin(schema.clients, eq(schema.contracts.clientId, schema.clients.id))
            .limit(5);

        console.log('Contracts fetched:', contracts.length);
        console.log(JSON.stringify(contracts, null, 2));
    } catch (error) {
        console.error('DATABASE ERROR:', error);
    } finally {
        process.exit();
    }
}

test();
