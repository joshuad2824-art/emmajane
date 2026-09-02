import "server-only";
import { env } from "./env";

/** Optional notification email through Resend. Silently a no-op until RESEND_API_KEY and NOTIFY_EMAIL are set. */
export async function notify(subject: string, text: string) {
  if (!env.resendApiKey || !env.notifyEmail) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.fromEmail, to: [env.notifyEmail], subject, text }),
    });
    if (!res.ok) console.error("[email] resend responded", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email] failed:", (e as Error).message);
    return false;
  }
}
