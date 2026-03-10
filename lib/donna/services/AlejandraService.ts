import fs from 'fs';
import path from 'path';
import { getAIClient, getModelId } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { contactChannels, contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Role = 'cesar' | 'abel' | 'vendedores' | 'ventas';

export interface AlejandraDigest {
    role: Role;
    intent: 'CHAT' | 'SCHEDULE' | 'KNOWLEDGE' | 'COTIZACION' | 'CONTRATO' | 'FINANZA' | 'VENTA' | 'QUERY_AGENDA' | 'RECORRIDO' | 'TASK';
    digest: string;
    subtype?: string;
    reasoning?: string;
    data?: {
        response?: string;
        date?: string;
        time?: string;
        contact_name?: string;
        business_name?: string;
        location?: string;
        interest_tier?: 'PRO' | 'ELITE' | 'IMPERIO' | 'EMPRENDEDOR' | 'CRECIMIENTO' | 'POSICIONAMIENTO';
        category?: 'hotel' | 'restaurante' | 'web' | 'seo';
        // RECORRIDO-specific fields
        interest_level?: 'interested' | 'not_interested' | 'maybe' | 'quoted';
        verbal_agreements?: string;
        interested_product?: string;
        generate_quotation?: boolean;
        details?: any;
    };
    needs_clarification?: boolean;
    clarification_question?: string;
    handover?: boolean;
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
    async identifyAndTranslate(text: string, context: { chatId: string; contactName?: string; businessName?: string; source: string; history?: string }): Promise<AlejandraDigest> {
        // 1. HARDCODED & DB-BACKED ROLE DETECTION
        let detectedRole: Role | null = null;
        const cleanChatId = context.chatId.replace(/\D/g, '');

        // A. Environment Fallback for Cesar & Abel
        const cesarPhone = process.env.CESAR_PHONE || '963410409';
        const abelPhone = process.env.ABEL_PHONE || '967491847';
        if (cleanChatId.endsWith(cesarPhone) || context.chatId.includes('cesar')) {
            detectedRole = 'cesar';
        } else if (cleanChatId.endsWith(abelPhone) || context.chatId.includes('abel')) {
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
            intent: 'CHAT',
            digest: text.substring(0, 100),
            needs_clarification: false,
            clarification_question: undefined
        };

        if (!this.rolePrompt) return digest;

        try {
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');

            const contextStr = `Role Detectado: ${detectedRole || 'Pendiente AI'}, Nombre: ${context.contactName || 'Desconocido'}, Empresa: ${context.businessName || 'N/A'}, Origen: ${context.source}`;
            const historyStr = context.history ? `\n\n[HISTORIAL RECIENTE]:\n${context.history}` : '';
            const systemPrompt = `${this.rolePrompt}\n\n[CONTEXTO]: ${contextStr}${historyStr}`;

            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const content = JSON.parse(response.choices[0]?.message?.content || '{}');

            // Merge AI results with detected role
            digest = {
                ...digest,
                ...content,
                role: detectedRole || content.role || 'ventas',
                digest: content.reasoning || content.response || text.substring(0, 100),
                intent: (content.intent || 'CHAT').toUpperCase() as any
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
