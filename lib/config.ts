const set = (v: string | undefined) => (v ? v : undefined);

// NEXT_PUBLIC_* values are inlined when the app is built, so rebuild after changing them.
export const API_URL = set(process.env.NEXT_PUBLIC_API_URL) ?? "/api";
export const BOT_URL = set(process.env.NEXT_PUBLIC_BOT_URL) ?? "https://t.me/usetenth_bot";
// Sign-in and sign-up are for the installed app and Telegram; browsers may use them in development or when this is set.
export const ALLOW_BROWSER_AUTH = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_BROWSER_AUTH === "true";
export const SAMPLE_PAYMENT = set(process.env.NEXT_PUBLIC_SAMPLE_PAYMENT) ?? "800.00";
