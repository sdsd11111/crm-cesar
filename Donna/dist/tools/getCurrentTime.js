import { z } from "zod";
export const getCurrentTimeDefinition = {
    type: "function",
    function: {
        name: "get_current_time",
        description: "Get the current time and date in ISO format. Useful for knowing what time it is right now.",
        parameters: {
            type: "object",
            properties: {
                timezone: {
                    type: "string",
                    description: "Optional IANA timezone string (e.g. 'America/New_York'). If not provided, returns local time."
                }
            },
            required: []
        }
    }
};
export const getCurrentTimeSchema = z.object({
    timezone: z.string().optional()
});
export async function executeGetCurrentTime(args) {
    const date = new Date();
    if (args.timezone) {
        try {
            return date.toLocaleString('en-US', { timeZone: args.timezone });
        }
        catch (e) {
            return `Invalid timezone: ${args.timezone}. System time is ${date.toISOString()}`;
        }
    }
    return date.toISOString();
}
