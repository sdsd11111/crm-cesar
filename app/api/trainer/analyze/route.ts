import { type NextRequest, NextResponse } from "next/server";
import { TrainerAnalyzer } from "@/lib/trainer/trainer-analyzer";
import { db } from "@/lib/db";
import { callAnalyses } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const contactId = formData.get("contactId") as string;
        const leadId = formData.get("leadId") as string;
        const discoveryLeadId = formData.get("discoveryLeadId") as string;

        if (!audioFile) {
            return NextResponse.json({ error: "No se encontró archivo de audio" }, { status: 400 });
        }

        // 1. Transcribe
        const apiKey = process.env.OPENAI_API_KEY;
        const transcriptionFormData = new FormData();
        transcriptionFormData.append("file", audioFile);
        transcriptionFormData.append("model", "whisper-1");
        transcriptionFormData.append("language", "es");

        const transcribeRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: transcriptionFormData,
        });

        if (!transcribeRes.ok) throw new Error("Transcription failed");
        const { text: transcription } = await transcribeRes.json();

        // 2. Analyze with Trainer Agents
        const analyzer = new TrainerAnalyzer();
        const analysis = await analyzer.analyzeCall(transcription);

        // 3. Save to DB
        // NOTE: We check if contactId exists in the schema during research.
        // For now, we use a dynamic object to avoid TS errors if the schema is being updated.
        const values: any = {
            transcription: JSON.stringify({ text: transcription }),
            metrics: JSON.stringify(analysis.metrics),
            feedback: JSON.stringify(analysis.feedback),
            nextFocus: analysis.feedback.next_focus || "",
        };

        if (contactId) values.contactId = contactId;
        if (leadId) values.leadId = leadId;
        if (discoveryLeadId) values.discoveryLeadId = discoveryLeadId;

        const saved = await db.insert(callAnalyses).values(values).returning();

        return NextResponse.json({
            success: true,
            analysis: analysis,
            transcription: transcription,
            analysisId: saved[0].id
        });

    } catch (error: any) {
        console.error("❌ Trainer Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
