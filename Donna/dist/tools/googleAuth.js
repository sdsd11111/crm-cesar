import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
const CREDENTIALS_PATH = path.resolve("./google-oauth.json");
const TOKEN_PATH = path.resolve("./google-token.json");
// Scopes required for Gmail and Calendar
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
];
export async function authorize() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error(`Credentials file not found at ${CREDENTIALS_PATH}. Please ensure you have downloaded it from Google Cloud Console.`);
    }
    const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
    const credentials = JSON.parse(content);
    // Support either desktop app or web app format from Google
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0] || "urn:ietf:wg:oauth:2.0:oob");
    // Check if we have previously stored a token.
    if (!fs.existsSync(TOKEN_PATH)) {
        return await getNewToken(oAuth2Client);
    }
    try {
        const token = fs.readFileSync(TOKEN_PATH, "utf8");
        oAuth2Client.setCredentials(JSON.parse(token));
        // Refresh token if necessary will happen automatically by the client
        return oAuth2Client;
    }
    catch (err) {
        console.warn("Stored token is invalid, getting a new one...");
        return await getNewToken(oAuth2Client);
    }
}
async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // Force to get refresh token
        scope: SCOPES,
    });
    console.log("\n=======================================================");
    console.log("ACCION REQUERIDA PARA DONNA:");
    console.log("Por favor visita esta URL para autorizar esta aplicacion:");
    console.log(authUrl);
    console.log("=======================================================\n");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const code = await rl.question("Introduce el código de autorización que Google te da en la página: ");
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    // Store the token to disk for later program executions
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log(`Token almacenado en ${TOKEN_PATH}`);
    return oAuth2Client;
}
