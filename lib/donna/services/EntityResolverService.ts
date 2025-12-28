import { db } from '@/lib/db';
import { contacts, tasks } from '@/lib/db/schema';
import { ilike, or, eq } from 'drizzle-orm';

/**
 * Entity Resolver Service
 * Resuelve nombres de personas/empresas mencionados en inputs de César
 * y los vincula con contactos existentes o crea nuevos contactos provisionales.
 */
export class EntityResolverService {

    /**
     * Extrae nombres de personas o empresas del texto usando IA
     */
    async extractEntities(text: string, aiProvider: any): Promise<string[]> {
        // Load prompt from file
        const fs = await import('fs');
        const path = await import('path');
        const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'entity_extractor.md');
        const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
        const prompt = promptTemplate.replace('{text}', text);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiProvider.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const entities = JSON.parse(cleaned);

            console.log('🔍 Extracted entities:', entities);
            return Array.isArray(entities) ? entities : [];
        } catch (error) {
            console.error('❌ Error extracting entities:', error);
            return [];
        }
    }

    /**
     * Busca contactos por nombre (fuzzy matching)
     */
    async findContactByName(name: string): Promise<any[]> {
        try {
            const matches = await db
                .select()
                .from(contacts)
                .where(
                    or(
                        ilike(contacts.contactName, `%${name}%`),
                        ilike(contacts.businessName, `%${name}%`)
                    )
                )
                .limit(5);

            console.log(`🔎 Found ${matches.length} matches for "${name}"`);
            return matches;
        } catch (error) {
            console.error('❌ Error searching contacts:', error);
            return [];
        }
    }

    /**
     * Resuelve una entidad a un contactId
     * Retorna el contactId si hay match único, null si necesita aclaración
     */
    async resolve(entityName: string, sendTelegramMessage: Function): Promise<string | null> {
        const matches = await this.findContactByName(entityName);

        if (matches.length === 0) {
            // No existe - ofrecer crear contacto
            await sendTelegramMessage(
                `❓ No conozco a "${entityName}". ¿Es un contacto nuevo?\n\n` +
                `Responde:\n` +
                `1️⃣ Sí, crear contacto\n` +
                `2️⃣ No, dame más info\n` +
                `3️⃣ Ignorar por ahora`
            );
            return null; // Necesita aclaración
        }

        if (matches.length === 1) {
            // Match único - usar automáticamente
            console.log(`✅ Resolved "${entityName}" to contact: ${matches[0].id}`);
            return matches[0].id;
        }

        // Múltiples matches - pedir aclaración
        let message = `❓ Encontré ${matches.length} contactos con "${entityName}":\n\n`;
        matches.forEach((contact, index) => {
            const displayName = contact.businessName || contact.contactName || 'Sin nombre';
            message += `${index + 1}️⃣ ${displayName}\n`;
        });
        message += `\nResponde con el número.`;

        await sendTelegramMessage(message);
        return null; // Necesita aclaración
    }

    /**
     * Crea un contacto provisional con datos mínimos
     * y genera una tarea para completar la información
     */
    async createProvisionalContact(name: string): Promise<string> {
        try {
            // Determinar si es nombre de persona o empresa
            const isBusinessName = name.toLowerCase().includes('restaurante') ||
                name.toLowerCase().includes('ferretería') ||
                name.toLowerCase().includes('tienda') ||
                name.toLowerCase().includes('empresa');

            const newContact = await db.insert(contacts).values({
                contactName: isBusinessName ? 'Por definir' : name,
                businessName: isBusinessName ? name : 'Por definir',
                source: 'donna_recorrido', // Marca especial
                status: 'new',
            }).returning();

            const contactId = newContact[0].id;
            console.log(`✅ Created provisional contact: ${contactId} (${name})`);

            // Crear tarea automática para completar información
            await db.insert(tasks).values({
                title: `📝 Completar información de ${name}`,
                description: `Contacto creado automáticamente por Donna durante un recorrido. Agregar:\n- Teléfono\n- Email\n- Dirección\n- Tipo de negocio\n- Necesidades detectadas`,
                status: 'todo',
                priority: 'high',
                contactId: contactId,
                assignedTo: 'César',
            });

            console.log(`✅ Created follow-up task for ${name}`);

            return contactId;
        } catch (error) {
            console.error('❌ Error creating provisional contact:', error);
            throw error;
        }
    }

    /**
     * Maneja la respuesta de César a una solicitud de aclaración
     */
    async handleClarificationResponse(
        response: string,
        originalEntity: string,
        matches: any[]
    ): Promise<string | null> {
        const trimmed = response.trim();

        // Si es un número, seleccionar de la lista
        const num = parseInt(trimmed);
        if (!isNaN(num) && num > 0 && num <= matches.length) {
            return matches[num - 1].id;
        }

        // Si dice "1" cuando no hay matches (crear contacto)
        if (trimmed === '1' && matches.length === 0) {
            return await this.createProvisionalContact(originalEntity);
        }

        // Si dice "3" (ignorar)
        if (trimmed === '3') {
            return null;
        }

        // Si da más información, buscar de nuevo
        return await this.resolve(response, () => { });
    }
}

export const entityResolver = new EntityResolverService();
