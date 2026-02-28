import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

export interface ExtractedPdfContext {
    summary: string;
    entities: {
        client_name?: string;
        business_name?: string;
        products_mentioned?: string[];
        price_total?: string;
        agreement_points?: string[];
    };
    raw_text?: string;
}

export class PdfIntelligenceService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || "";
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Analiza un PDF (vía base64 o buffer) para extraer contexto comercial.
     * Útil para cuando el cliente envía una propuesta previa o requerimientos.
     */
    async extractContextFromPdf(
        fileBuffer: Buffer,
        fileName: string
    ): Promise<ExtractedPdfContext> {
        console.log(`📂 [PdfIntelligenceService] Analizando archivo: ${fileName}`);

        try {
            const model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash", // Flash is enough and faster for extraction
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Analiza este documento PDF y extrae los puntos comerciales clave. 
      Especialmente busca: Nombres de clientes, nombres de negocios, servicios mencionados, precios acordados y compromisos.
      
      Responde en JSON con esta estructura:
      {
        "summary": "Resumen conciso del documento",
        "entities": {
          "client_name": "Nombre de la persona",
          "business_name": "Nombre de la empresa",
          "products_mentioned": ["lista", "de", "servicios"],
          "price_total": "valor total si existe",
          "agreement_points": ["puntos", "clave"]
        }
      }`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: "application/pdf"
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();

            return JSON.parse(text) as ExtractedPdfContext;
        } catch (error) {
            console.error("❌ [PdfIntelligenceService] Error al procesar PDF:", error);
            throw error;
        }
    }
}

export const pdfIntelligenceService = new PdfIntelligenceService();
