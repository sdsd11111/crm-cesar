/**
 * Run this script ONCE to authorize Donna with your Google account.
 * After it completes, the token is saved in google-token.json and
 * you never need to run this again (unless you revoke access).
 *
 * Usage:
 *   npx tsx scripts/auth-google.ts
 */

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";

const CREDENTIALS_PATH = path.resolve("./google-oauth.json");
const TOKEN_PATH = path.resolve("./google-token.json");

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
];

async function main() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error(`ERROR: No se encontró ${CREDENTIALS_PATH}`);
        console.error("Descarga el archivo de credenciales desde Google Cloud Console.");
        process.exit(1);
    }

    const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0] || "urn:ietf:wg:oauth:2.0:oob"
    );

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
    });

    console.log("\n======================================================");
    console.log("Paso 1: Abre esta URL en tu navegador para autorizar:");
    console.log("======================================================");
    console.log(authUrl);
    console.log("======================================================\n");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const raw = await rl.question("Paso 2: Pega aquí el CÓDIGO de la URL (solo la parte después de 'code=', hasta '&scope'): ");
    rl.close();

    // Strip any accidental extras (scope, spaces, etc.)
    const code = raw.split("&")[0].trim();

    console.log(`\nUsando código: ${code}\n`);

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`\n✅ Token guardado correctamente en: ${TOKEN_PATH}`);
    console.log("Ya puedes arrancar el bot con: npm run dev");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error en la autenticación:", err.message);
    process.exit(1);
});
