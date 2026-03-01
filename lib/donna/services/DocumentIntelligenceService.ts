import fs from 'fs';
import path from 'path';
import { getAIClient, getModelId } from './CortexRouterService'; // Reusing existing AI factory
import { db } from '../../db';
import { donnaInstructions } from '../../db/schema';
import { eq } from 'drizzle-orm';

// ----------------------------------------------------
// Tipos para Cerebro 1: Product Recognizer
// ----------------------------------------------------
export interface ProductRecognitionResult {
    productos_identificados: {
        nombre_oficial: string;
        precio_oficial: number;
        cantidad: number;
        observaciones_del_usuario: string;
    }[];
    es_claro: boolean;
    pregunta_clarificacion: string | null;
    tipo_documento_sugerido: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO';
}

/**
 * Servicio encargado de la orquestación de la Inteligencia Documental (Donna Brains).
 * - Cerebro 1: Product Recognizer (Entiende qué vender)
 * - Cerebro 2: The Reasoner (Entiende cómo presentarlo)
 * - Cerebro 3: The Presenter (Redacta el documento)
 */
export class DocumentIntelligenceService {
    private brainsPath = path.join(process.cwd(), 'lib', 'donna', 'prompts');
    private catalogPath = path.join(process.cwd(), '.agent', 'product_catalog.md');

    // Helper para cargar prompts y catálogo
    private loadFileConfig(filename: string): string {
        // Si es el catálogo, búscalo en la ruta específica de knowledge
        const actualPath = filename === 'product_catalog.md'
            ? this.catalogPath
            : path.join(this.brainsPath, filename);

        try {
            if (fs.existsSync(actualPath)) {
                return fs.readFileSync(actualPath, 'utf-8');
            }
            return ``;
        } catch (e) {
            console.error(`Error loading file config ${filename}:`, e);
            return '';
        }
    }

    /**
     * Obtiene la "Mochila de Experiencia" (RAG de Instrucciones)
     */
    public async getExperiencePack(): Promise<string> {
        try {
            const instructions = await db.select({ instruction: donnaInstructions.instruction }).from(donnaInstructions).where(eq(donnaInstructions.isActive, true));
            if (!instructions.length) return 'Sin instrucciones históricas registradas aún.';

            return instructions.map(i => `- ${i.instruction}`).join('\n');
        } catch (e) {
            console.error('[DocumentIntelligenceService] Error loading Instructions RAG:', e);
            return 'Sin instrucciones históricas.';
        }
    }

    /**
     * CEREBRO 1: Product Recognizer
     * Analiza la petición del usuario contra el catálogo oficial.
     */
    public async recognizeProducts(userInput: string, instructionsHistory: string = ''): Promise<ProductRecognitionResult> {
        const promptTemplate = this.loadFileConfig('prompt_product_recognizer.md');
        const catalog = this.loadFileConfig('product_catalog.md');

        const fullPrompt = promptTemplate
            .replace('{{USER_INPUT}}', userInput)
            .replace('{{PRODUCT_CATALOG}}', catalog)
            .replace('{{DONNA_INSTRUCTIONS}}', instructionsHistory || 'Sin instrucciones adicionales recientes.');

        // Forzamos el reconocimiento de intención de contrato si la palabra aparece
        const contractForce = userInput.toLowerCase().includes('contrato') ? ' Si detectas que pide un contrato, pon tipo_documento_sugerido: "CONTRATO".' : '';
        const promptRequest = `Analiza esto devolviendo estrictamente un JSON puro como se configuró: \n${fullPrompt}${contractForce}`;

        try {
            // Usamos el cliente estándar (Fast) pero con temperature 0 para que sea analítico, no creativo.
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');
            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'system', content: promptRequest }],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const responseText = response.choices[0]?.message?.content || '{}';

            // Intentamos extraer el JSON de la respuesta
            const jsonMatch = responseText.match(/```json([\s\S]*?)```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : responseText.trim();

            const result = JSON.parse(jsonString) as ProductRecognitionResult;

            // Allow "CONTRATO" as a valid suggested type if inferred
            return result;

        } catch (error) {
            console.error('[DocumentIntelligenceService] Error en Cerebro 1:', error);
            // Fallback seguro en caso de que el modelo falle o devuelva algo raro
            return {
                productos_identificados: [],
                es_claro: false,
                pregunta_clarificacion: "César, el Cerebro 1 no pudo extraer exactamente los productos. ¿Podrías confirmarme qué ítems específicos del catálogo le cotizamos?",
                tipo_documento_sugerido: 'COTIZACION'
            };
        }
    }

    /**
     * CEREBRO 2: The Reasoner (Estratega de Formato)
     * Decide si el documento debe ser una Cotización simple o una Propuesta compleja o un Contrato.
     */
    public async determineFormat(userInput: string, identifiedProducts: ProductRecognitionResult): Promise<{ formato_decidido: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO', razonamiento_interno: string }> {
        const promptTemplate = this.loadFileConfig('prompt_format_reasoner.md');

        const fullPrompt = promptTemplate
            .replace('{{USER_INPUT}}', userInput)
            .replace('{{IDENTIFIED_PRODUCTS}}', JSON.stringify(identifiedProducts, null, 2));

        const promptRequest = `Analiza esto devolviendo estrictamente un JSON puro como se configuró. Añade CONTRATO como opción si el usuario pide cerrar o firmar: \n${fullPrompt}`;

        try {
            const aiClient = getAIClient('FAST');
            const modelId = getModelId('FAST');
            const response = await aiClient.chat.completions.create({
                model: modelId,
                messages: [{ role: 'system', content: promptRequest }],
                temperature: 0,
                response_format: { type: 'json_object' }
            });

            const responseText = response.choices[0]?.message?.content || '{}';

            // Intentamos extraer el JSON de la respuesta
            const jsonMatch = responseText.match(/```json([\s\S]*?)```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : responseText.trim();

            return JSON.parse(jsonString) as { formato_decidido: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO', razonamiento_interno: string };

        } catch (error) {
            console.error('[DocumentIntelligenceService] Error en Cerebro 2:', error);
            // Fallback seguro: si el Cerebro 1 sugirió propuesta, úsala; si no, cotización por defecto.
            return {
                formato_decidido: identifiedProducts.tipo_documento_sugerido || 'COTIZACION' as any,
                razonamiento_interno: 'Fallback por error en Cerebro 2'
            };
        }
    }

    /**
     * CEREBRO 3: The Presenter
     * Redacta el documento final en el formato elegido usando los datos extraídos.
     */
    public async generateDocument(
        format: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO',
        identifiedProducts: ProductRecognitionResult,
        contactData: { contactName: string; businessName: string; pains: string },
        instructionsHistory: string = ''
    ): Promise<string> {
        let promptFileName = 'prompt_presenter_quotation.md';
        if (format === 'PROPUESTA') promptFileName = 'prompt_presenter_proposal.md';
        if (format === 'CONTRATO') promptFileName = 'prompt_contrato_generic.md'; // Using the legal-leaning generic one

        const promptTemplate = this.loadFileConfig(promptFileName);

        const fullPrompt = promptTemplate
            .replace('{{CONTACT_NAME}}', contactData.contactName || 'Cliente')
            .replace('{{BUSINESS_NAME}}', contactData.businessName || 'Su Empresa')
            .replace('{{PAINS}}', contactData.pains || 'Sin información previa de dolores.')
            .replace('{{IDENTIFIED_PRODUCTS}}', JSON.stringify(identifiedProducts, null, 2))
            .replace('{{DONNA_INSTRUCTIONS}}', instructionsHistory || 'Sin instrucciones adicionales recientes.');

        try {
            // Usamos modelo "STANDARD" o "CREATIVE" porque aquí sí queremos buena redacción, no solo JSON estricto.
            const aiClientGen = getAIClient('STANDARD');
            const modelIdGen = getModelId('STANDARD');

            const response = await aiClientGen.chat.completions.create({
                model: modelIdGen,
                messages: [
                    { role: 'system', content: fullPrompt },
                    { role: 'user', content: 'Por favor, redacta el documento final en formato Markdown limpio y profesional basado estrictamente en el contexto y los productos dados.' }
                ],
                // Un poco más de temperatura para que suene humano, pero no demasiado para no inventar cosas
                temperature: 0.5
            });

            return response.choices[0]?.message?.content || 'Hubo un error al generar el texto del documento.';

        } catch (error) {
            console.error('[DocumentIntelligenceService] Error en Cerebro 3:', error);
            throw new Error('No se pudo generar el documento.');
        }
    }
}

export const documentIntelligenceService = new DocumentIntelligenceService();
