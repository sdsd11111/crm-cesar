/**
 * Formats a full name from "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" 
 * or similar formats into "NOMBRE1 APELLIDO1".
 */
export function formatContactName(fullRawName: string | null | undefined): string {
    if (!fullRawName) return "";

    // Clean extra spaces and normalize
    const cleanName = fullRawName.trim().replace(/\s+/g, ' ');
    if (!cleanName) return "";

    const parts = cleanName.split(' ');

    // CASE 1: Typical Ecuador format (often from Public Registries): 
    // "LASTNAME1 LASTNAME2 FIRSTNAME1 FIRSTNAME2" (4 parts)
    if (parts.length >= 4) {
        const firstName = parts[2];
        const firstLastName = parts[0];
        return `${capitalize(firstName)} ${capitalize(firstLastName)}`;
    }

    // CASE 2: "LASTNAME1 LASTNAME2 FIRSTNAME1" (3 parts)
    if (parts.length === 3) {
        // This is tricky, but usually the first two are last names in these databases
        const firstName = parts[2];
        const firstLastName = parts[0];
        return `${capitalize(firstName)} ${capitalize(firstLastName)}`;
    }

    // CASE 3: "FIRSTNAME LASTNAME" (2 or less parts)
    // We assume it's already in a readable format or we just capitalize it
    return parts.map(p => capitalize(p)).join(' ');
}

function capitalize(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
