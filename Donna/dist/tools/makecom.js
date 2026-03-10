import { z } from "zod";
// ---------------------------------------------------------------------------
// Tool: trigger_make_scenario
// Triggers a Make.com webhook to run an automation (e.g. publish social posts)
// ---------------------------------------------------------------------------
// Each scenario has a readable name and an env variable key for its webhook URL
const SCENARIOS = {
    "publicar_activaqr": {
        label: "Publicar contenido de ActivaQR en redes sociales",
        envKey: "MAKE_WEBHOOK_ACTIVAQR_POST",
    },
    "publicar_objetivo": {
        label: "Publicar contenido de OBJETIVO en redes sociales",
        envKey: "MAKE_WEBHOOK_OBJETIVO_POST",
    },
    "refrescar_tokens": {
        label: "Refrescar tokens de Google Drive para automaciones de Make",
        envKey: "MAKE_WEBHOOK_REFRESH_TOKENS",
    },
};
export const triggerMakeSchema = z.object({
    scenario: z.enum(["publicar_activaqr", "publicar_objetivo", "refrescar_tokens"])
        .describe("Qué escenario de Make.com activar"),
    payload: z.record(z.string()).optional()
        .describe("Datos adicionales a enviar al webhook (ej. { tema: 'lanzamiento TV', copy: '...' })"),
});
export const triggerMakeDefinition = {
    type: "function",
    function: {
        name: "trigger_make_scenario",
        description: `Activa una automatización de Make.com (antes Integromat) usando un webhook. Úsalo para publicar en redes sociales, refrescar tokens de Google Drive, o cualquier automatización ya configurada. Escenarios disponibles: ${Object.entries(SCENARIOS).map(([k, v]) => `"${k}" → ${v.label}`).join("; ")}`,
        parameters: {
            type: "object",
            properties: {
                scenario: {
                    type: "string",
                    enum: Object.keys(SCENARIOS),
                    description: "Escenario a activar",
                },
                payload: {
                    type: "object",
                    description: "Datos adicionales para el webhook (opcional)",
                    additionalProperties: { type: "string" },
                },
            },
            required: ["scenario"],
        },
    },
};
export async function executeTriggerMake(args) {
    const scenarioConfig = SCENARIOS[args.scenario];
    if (!scenarioConfig) {
        return `❌ Escenario desconocido: "${args.scenario}".`;
    }
    const webhookUrl = process.env[scenarioConfig.envKey];
    if (!webhookUrl) {
        return `❌ El webhook para "${args.scenario}" no está configurado. Falta la variable de entorno ${scenarioConfig.envKey} en el .env`;
    }
    try {
        const body = { scenario: args.scenario, ...args.payload };
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`Make.com respondió ${res.status}`);
        }
        return `✅ Automatización "${scenarioConfig.label}" activada en Make.com. ${args.payload ? `Datos enviados: ${JSON.stringify(args.payload)}` : ""}`;
    }
    catch (err) {
        return `❌ Error activando Make.com: ${err.message}`;
    }
}
