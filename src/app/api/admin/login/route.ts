import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, sessionCookieOptions, verifyAdminPassword } from "@/lib/auth";
import { fail, handler, readJson, str } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req: Request) => {
  const limit = rateLimit(`login:${clientIp(req)}`, 5, 15 * 60_000);
  if (!limit.ok) return fail(429, `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.`);
  const body = await readJson<{ password?: unknown }>(req);
  const password = str(body.password, 200);
  let admin = null;
  try {
    admin = password ? await verifyAdminPassword(password) : null;
  } catch (e) {
    if (/DATABASE_URL|ECONNREFUSED|ENOTFOUND|does not exist/.test((e as Error).message)) {
      return fail(503, "The site's database is not connected yet — finish the Fly setup first.");
    }
    throw e;
  }
  if (!admin) {
    // A small, growing delay on failures makes brute force slower still.
    await new Promise((r) => setTimeout(r, 400));
    return fail(401, "That isn't it.");
  }
  const session = await createSession(admin.id);
  const res = NextResponse.json({ ok: true, email: admin.email });
  res.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions(session.expires));
  return res;
});
