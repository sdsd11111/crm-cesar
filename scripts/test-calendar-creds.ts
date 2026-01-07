
// Script to test robust JSON parsing logic for Env Vars
const testCases = [
    { name: "Standard JSON", input: '{"foo": "bar"}' },
    { name: "Quoted JSON", input: '"{"foo": "bar"}"' },
    { name: "Single Quoted JSON", input: "'{\"foo\": \"bar\"}'" },
    { name: "With Newlines", input: '{"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCCBswggIYAgEAAoIBAQD..."}' },
    { name: "With Escaped Newlines", input: '{"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCCBswggIYAgEAAoIBAQD..."}' },
    { name: "Vercel-style double escape", input: '"{\\"private_key\\": \\"-----BEGIN PRIVATE KEY-----\\\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCCBswggIYAgEAAoIBAQD...\\"}"' }
];

function parseCredentials(credentialsVar: string) {
    let text = credentialsVar.trim();

    // Strategy 1: Simple Clean & Parse
    // Remove wrapping quotes if they exist
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
    }

    try {
        return { success: true, keys: Object.keys(JSON.parse(text)), method: "Simple Clean" };
    } catch (e1) {
        // Strategy 2: Unescape Double-Escaped (Vercel/Shell artifacts)
        // e.g. "{\"type\": ...}" -> {"type": ...}
        try {
            const unescaped = text.replace(/\\"/g, '"').replace(/\\\\n/g, '\\n');
            return { success: true, keys: Object.keys(JSON.parse(unescaped)), method: "Unescape Quotes" };
        } catch (e2) {
            // Strategy 3: Handle Literal Newlines (Copy-paste error)
            // Literal newlines \n in the string break JSON.parse. We need to escape them to \\n
            try {
                const escapedNewlines = text.replace(/\n/g, '\\n').replace(/\r/g, '');
                return { success: true, keys: Object.keys(JSON.parse(escapedNewlines)), method: "Escape Newlines" };
            } catch (e3) {
                // Strategy 4: The "Nuclear" Option for Double-JSON-Encoded strings
                try {
                    const parsedOnce = JSON.parse(credentialsVar); // Parse the outer string
                    if (typeof parsedOnce === 'string') {
                        return { success: true, keys: Object.keys(JSON.parse(parsedOnce)), method: "Double Parse" };
                    }
                } catch (e4) {
                    return { success: false, error: e1.message + " | " + e2.message + " | " + e3.message };
                }
                return { success: false, error: "All strategies failed" };
            }
        }
    }
}

console.log("--- Google Credentials Parsing Test ---");
testCases.forEach(tc => {
    const result = parseCredentials(tc.input);
    console.log(`[${tc.name}] Success: ${result.success} ${result.error ? '- ' + result.error : ''}`);
});
