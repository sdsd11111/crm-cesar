import { db } from '@/lib/db';
import { contacts, tasks, leads, clients, prospects } from '@/lib/db/schema';
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
    async findContactByName(name: string, allowedTables: string[] = ['contacts', 'leads', 'clients', 'prospects']): Promise<any[]> {
        const cleanName = name.trim();
        if (!cleanName) return [];

        try {
            const searchInTables = async (term: string) => {
                const promises = [];
                if (allowedTables.includes('contacts')) {
                    promises.push(db.select().from(contacts).where(or(ilike(contacts.contactName, `%${term}%`), ilike(contacts.businessName, `%${term}%`))).limit(3).then(res => res.map(m => ({ ...m, sourceTable: 'contacts' }))));
                }
                if (allowedTables.includes('leads')) {
                    promises.push(db.select().from(leads).where(or(ilike(leads.contactName, `%${term}%`), ilike(leads.businessName, `%${term}%`))).limit(3).then(res => res.map(m => ({ ...m, sourceTable: 'leads' }))));
                }
                if (allowedTables.includes('clients')) {
                    promises.push(db.select().from(clients).where(or(ilike(clients.contactName, `%${term}%`), ilike(clients.businessName, `%${term}%`))).limit(3).then(res => res.map(m => ({ ...m, sourceTable: 'clients' }))));
                }
                if (allowedTables.includes('prospects')) {
                    promises.push(db.select().from(prospects).where(or(ilike(prospects.contactName, `%${term}%`), ilike(prospects.businessName, `%${term}%`))).limit(3).then(res => res.map(m => ({ ...m, sourceTable: 'prospects' }))));
                }
                return (await Promise.all(promises)).flat();
            };

            // 1. Full string match
            let matches = await searchInTables(cleanName);

            // 2. If no matches and name is multi-word, try individual parts (RECURSIVE-ish)
            if (matches.length === 0 && cleanName.includes(' ')) {
                const parts = cleanName.split(/\s+/).filter(p => p.length > 2);
                if (parts.length > 0) {
                    console.log(`🔍 No strict matches for "${cleanName}", trying partial: "${parts[0]}"`);
                    matches = await searchInTables(parts[0]);
                }
            }

            // Unify and prioritize
            const uniqueMatches = Array.from(new Map(matches.map(m => [m.id, m])).values());

            // Prioritize 'star' category
            uniqueMatches.sort((a: any, b: any) => {
                const aStar = (a.categoryTags || []).includes('star') ? 1 : 0;
                const bStar = (b.categoryTags || []).includes('star') ? 1 : 0;
                return bStar - aStar;
            });

            console.log(`🔎 Found ${uniqueMatches.length} total matches for "${cleanName}" in [${allowedTables.join(', ')}]`);
            return uniqueMatches.slice(0, 5);
        } catch (error) {
            console.error('❌ Error searching contacts:', error);
            return [];
        }
    }

    /**
     * Resuelve una entidad a un contactId
     * Retorna el contactId si hay match único, null si necesita aclaración
     */
    async resolve(entityName: string, allowedTables?: string[]): Promise<{ contactId: string | null, matches?: any[] }> {
        const { internalNotificationService } = await import('@/lib/messaging/services/InternalNotificationService');
        const matches = await this.findContactByName(entityName, allowedTables);

        if (matches.length === 0) {
            // No existe - ofrecer crear contacto
            await internalNotificationService.notifyCesar(
                `❓ No conozco a "${entityName}". ¿Es un contacto nuevo?\n\n` +
                `Responde:\n` +
                `1️⃣ Sí, crear contacto\n` +
                `2️⃣ No, dame más info\n` +
                `3️⃣ Ignorar por ahora`
            );
            return { contactId: null, matches: [] }; // Necesita aclaración
        }

        if (matches.length === 1) {
            // Match único - usar automáticamente
            console.log(`✅ Resolved "${entityName}" to contact: ${matches[0].id}`);
            return { contactId: matches[0].id };
        }

        // Múltiples matches - pedir aclaración
        let message = `❓ Encontré ${matches.length} contactos con "${entityName}":\n\n`;
        matches.forEach((contact, index) => {
            const displayName = contact.contactName || contact.businessName || 'Sin nombre';
            const tableLabel = contact.sourceTable === 'leads' ? ' (Lead)' : contact.sourceTable === 'clients' ? ' (Cliente)' : '';
            message += `${index + 1}️⃣ ${displayName}${tableLabel}\n`;
        });
        message += `\nResponde con el número o simplemente confirma si es el correcto.`;

        await internalNotificationService.notifyCesar(message);
        return { contactId: null, matches }; // Necesita aclaración
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
    ): Promise<{ contactId: string | null, matches?: any[] }> {
        const trimmed = response.trim();
        const num = parseInt(trimmed);

        // Si es un número válido de la lista
        if (!isNaN(num) && num > 0 && num <= matches.length) {
            return { contactId: matches[num - 1].id };
        }

        // Si no es un número, preguntar a la IA qué quiso decir César
        try {
            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{
                        role: 'system',
                        content: `Eres un experto en interpretar respuestas de usuarios en un CRM conversacional.
                        Donna preguntó: "No conozco a ${originalEntity}, ¿lo creo?" o mostró una lista de opciones.
                        El usuario acaba de responder: "${response}".
                        OPCIONES DISPONIBLES:
                        1. Sí, crear contacto / Opción 1 / Confirmar / Afirmación
                        2. No / Opción 2 / Más info / Negación de creación
                        3. Cancelar / Opción 3 / Ignorar / Detener flujo

                        Devuelve SOLO un número del 1 al 3 indicando qué opción eligió. Si no está claro, devuelve 0.`
                    }],
                    temperature: 0
                })
            });

            const data = await aiResponse.json();
            const choice = parseInt(data.choices[0].message.content);

            console.log(`🤖 AI interpreted choice: ${choice} for response: "${response}"`);

            if (choice === 1) {
                if (matches.length === 0) {
                    const id = await this.createProvisionalContact(originalEntity);
                    return { contactId: id };
                } else if (matches.length > 0) {
                    // Si hay varios y solo dijo "si", tomamos el primero
                    return { contactId: matches[0].id };
                }
            } else if (choice === 3) {
                return { contactId: null };
            }
        } catch (e) {
            console.error('Error in AI interpretation:', e);
        }

        // Si dice "3" (ignorar) explícitamente sin IA
        if (trimmed === '3') {
            return { contactId: null };
        }

        // Si da más información (quizás corrigió el nombre), intentar resolver de nuevo
        if (trimmed.length > 3 && !['1', '2', '3', 'si', 'no', 'ok', 'dale'].includes(trimmed.toLowerCase())) {
            return await this.resolve(response);
        }

        return { contactId: null };
    }
}

export const entityResolver = new EntityResolverService();
