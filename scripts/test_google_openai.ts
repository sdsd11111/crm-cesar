import { config } from "dotenv";
config({ path: ".env.local" });

async function testGeminiSDK() {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY; // The name of the env variable is GOOGLE_API_KEY
    if (!apiKey) throw new Error("GOOGLE_API_KEY not found");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent("Hola, esto es una prueba");
    console.log(result.response.text());
}

testGeminiSDK().catch(console.error);
