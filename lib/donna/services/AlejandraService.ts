import fs from 'fs';
import path from 'path';
import { getAIClient, getModelId } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { contactChannels, contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Role = 'cesar' | 'abel' | 'vendedores' | 'ventas';

export interface AlejandraDigest {
    role: Role;
    intent: 'agenda' | 'crear' | 'borrar' | 'cotizacion' | 'consulta' | 'desconocido';
    digest: string;
    parameters: {
        cliente?: string | null;
        producto?: string | null;
        precio?: string | null;
        fecha?: string | null;
        hora?: string | null;
    };
    needs_clarification: boolean;
    clarification_question: string | null;
}

/**
 * AlejandraService: Independent Porter & Command Translator.
 * She is the ONLY one who reads raw WhatsApp text.
 */
export class AlejandraService {
    private rolePrompt: string = '';

    constructor() {
        this.loadPrompt();
    }

    private loadPrompt() {
        try {
            const promptPath = path.join(process.cwd(), 'lib', 'donna', 'prompts', 'alejandra.md');
            if (fs.existsSync(promptPath)) {
                this.rolePrompt = fs.readFileSync(promptPath, 'utf-8');
            }
        } catch (error) {
            console.error('❌ AlejandraService: Error loading prompt:', error);
        }
    }

    /**
     * Identifies the Role and extracts a Command Digest.
     */
    async identifyAndTranslate(text: string, context: { chatId: string; contactName?: string; businessName?: string; source: string }): Promise<AlejandraDigest> {
        // 1. HARDCODED & DB-BACKED ROLE DETECTION
        let detectedRole: Role | null = null;
        const cleanChatId = context.chatId.replace(/\D/g, '');

        // A. Hardcoded Fallback for Cesar & Abel
        if (cleanChatId.endsWith('963410409') || context.chatId.includes('cesar')) {
            detectedRole = 'cesar';
        } else if (cleanChatId.endsWith('967491847') || context.chatId.includes('abel')) {
            detectedRole = 'abel';
        }

        // B. DB Check (verified channels)
        if (!detectedRole) {
            try {
                const results = await db.select()
                    .from(contactChannels)
                    .innerJoin(contacts, eq(contactChannels.contactId, contacts.id))
                    .where(
                        and(
                            eq(contactChannels.identifier, context.chatId),
                            eq(contactChannels.verified, true)
                        )
                    )
                    .limit(1);

                if (results.length > 0) {
                    const row = results[0];
                    if (row.contacts.contactName?.toLowerCase().includes('cesar')) detectedRole = 'cesar';
                    else if (row.contacts.contactName?.toLowerCase().includes('abel')) detectedRole = 'abel';
                    else if (row.contacts.categoryTags?.includes('vendedor')) detectedRole = 'vendedores';
                }
            } catch (dbErr) {
                console.error('❌ Alejandra DB Role Error:', dbErr);
            }
        }

        // 2. AI TRANSLATION (Internalization)
        let digest: AlejandraDigest = {
            role: detectedRole || 'ventas',
            intent: 'desconocido',
            digest: text.substring(0, 100),
            parameters: {},
            needs_clarification: false,
            clarification_question: null
        };

        if (!this.rolePrompt) return digest;

        try {
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');

            const contextStr = `Role Detectado: ${detectedRole || 'Pendiente AI'}, Nombre: ${context.contactName || 'Desconocido'}, Empresa: ${context.businessName || 'N/A'}, Origen: ${context.source}`;
            const prompt = `${this.rolePrompt}\n\n[CONTEXTO]: ${contextStr}\n[MENSAJE]: "${text}"`;

            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const content = JSON.parse(response.choices[0]?.message?.content || '{}');

            // Merge AI results with detected role
            digest = {
                ...digest,
                ...content,
                role: detectedRole || content.role || 'ventas'
            };

            // Safety fix: Ensure role is one of the allowed ones
            if (!['cesar', 'abel', 'vendedores', 'ventas'].includes(digest.role)) {
                digest.role = 'ventas';
            }

            console.log(`🙋‍♀️ [Alejandra] Role: ${digest.role} | Intent: ${digest.intent} | Needs Clarification: ${digest.needs_clarification}`);
            return digest;
        } catch (error) {
            console.error('❌ Alejandra AI Error:', error);
            return digest;
        }
    }
}

export const alejandraService = new AlejandraService();
