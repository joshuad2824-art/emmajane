import { query } from "@/lib/db";
import { notify } from "@/lib/email";
import { fail, handler, json, readJson, str } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// POST /api/inquiries — the Contact form
export const POST = handler(async (req: Request) => {
  const limit = rateLimit(`inquiry:${clientIp(req)}`, 6, 60 * 60_000);
  if (!limit.ok) return fail(429, "That is plenty of notes for one hour — I have them, I promise.");
  const b = await readJson<Record<string, unknown>>(req);
  if (str(b.website)) return json({ ok: true }); // honeypot: bots fill it, people never see it
  const name = str(b.name, 120), email = str(b.email, 200), message = str(b.message, 5000);
  if (!name) return fail(400, "I will need your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "That email does not look right.");
  const date = typeof b.preferred_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.preferred_date) ? b.preferred_date : null;
  const sessionType = str(b.session_type, 80), location = str(b.location, 200), phone = str(b.phone, 40);
  const optIn = b.opt_in === true;
  await query(
    `insert into inquiry (name, email, phone, session_type, preferred_date, location, message, opt_in) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [name, email, phone, sessionType, date, location, message, optIn],
  );
  notify(
    `New note from ${name}${sessionType ? ` · ${sessionType}` : ""}`,
    [`${name} <${email}>`, phone && `Phone: ${phone}`, sessionType && `Session: ${sessionType}`, date && `Date in mind: ${date}`, location && `Where: ${location}`, optIn && "Wants a note when fall dates open", "", message].filter(Boolean).join("\n"),
  ).catch(() => {});
  return json({ ok: true }, { status: 201 });
});
