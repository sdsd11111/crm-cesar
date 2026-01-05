"use server";

export async function getMetaStatus() {
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
    const token = process.env.META_WA_ACCESS_TOKEN;

    // Return true only if both critical variables are present
    const isConfigured = !!(phoneId && token);

    return {
        success: true,
        isConfigured,
        // Optional: Return partial info for debug if needed, but keep secrets safe
        debug: { hasPhoneId: !!phoneId, hasToken: !!token }
    };
}
