import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import fs from 'fs';
import path from 'path';
import { getAIClient, getModelId } from '@/lib/ai/client';

export async function POST(
    request: Request
) {
    const supabase = createServerClient()
    const cookieStore = cookies()

    try {
        const { clientId } = await request.json();

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
        }

        // 2. Fetch full client data
        const { data: client, error: clientError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', clientId)
            .eq('entity_type', 'client')
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const { data: interactions } = await supabase
            .from('interactions')
            .select('*')
            .eq('contact_id', clientId)
            .order('performed_at', { ascending: false })
            .limit(10);

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('contact_id', clientId)
            .limit(10);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })
            .limit(10);

        const { data: contracts } = await supabase
            .from('contracts')
            .select('*')
            .eq('client_id', clientId)
            .limit(5);

        // 3. Load prompt template
        const promptPath = path.join(process.cwd(), 'lib', 'openai', 'prompts', 'prompt_cortex_360.md'); // Keep path for now if file exists there
        let promptTemplate = fs.readFileSync(promptPath, 'utf8');

        // 4. Fill placeholders
        const clientDataStr = JSON.stringify(client, null, 2);
        const interactionsStr = JSON.stringify(interactions, null, 2);
        const tasksStr = JSON.stringify(tasks, null, 2);
        const transactionsStr = JSON.stringify(transactions, null, 2);
        const contractsStr = JSON.stringify(contracts, null, 2);

        promptTemplate = promptTemplate
            .replace('{{clientData}}', clientDataStr)
            .replace('{{interactions}}', interactionsStr)
            .replace('{{tasks}}', tasksStr)
            .replace('{{transactions}}', transactionsStr)
            .replace('{{contracts}}', contractsStr);

        // 5. Stream from AI (DeepSeek Reasoner)
        const clientAI = getAIClient('REASONING');
        const modelId = getModelId('REASONING');

        console.log(`🧠 Cortex 360 Analysis using ${modelId}`);

        const response = await clientAI.chat.completions.create({
            model: modelId,
            messages: [
                { role: 'user', content: `Eres un consultor estratégico senior experto en CRM y crecimiento de negocios. Analiza lo siguiente:\n\n${promptTemplate}` }
            ],
            stream: true,
            temperature: 0.7,
        });

        // Convert the response into a friendly text-stream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Error generating Cortex 360 report:', error);
        return NextResponse.json({ error: 'Failed to generate report', details: error.message }, { status: 500 });
    }
}
