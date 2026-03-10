
export class DeepSeekService {
    private apiKey: string;
    private baseUrl: string = "https://api.deepseek.com/v1";

    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY || "";
    }

    /**
     * Sends a prompt to DeepSeek and returns the structured response.
     */
    async analyze(prompt: string, model: string = "deepseek-chat"): Promise<any> {
        if (!this.apiKey) {
            console.error("❌ DeepSeek API Key missing");
            throw new Error("DeepSeek API Key missing. Please add DEEPSEEK_API_KEY to .env.local");
        }

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: 'Eres un asistente experto en análisis de negocios y perfiles de clientes.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1, // Low temperature for extraction
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`DeepSeek API Error: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            return JSON.parse(content);
        } catch (error) {
            console.error("❌ DeepSeek Analysis Error:", error);
            throw error;
        }
    }
}

export const deepSeekService = new DeepSeekService();
