import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { one, query } from "./db";
import { env } from "./env";
import { verifyPassword } from "./password.mjs";

export const SESSION_COOKIE = "ej_session";
const SESSION_DAYS = 30;

export type Admin = { id: string; email: string };

export async function verifyAdminPassword(password: string): Promise<Admin | null> {
  const admin = await one<{ id: string; email: string; password_hash: string }>(
    `select id, email, password_hash from admin order by created_at limit 1`,
  );
  if (!admin) return null;
  if (!verifyPassword(password, admin.password_hash)) return null;
  return { id: admin.id, email: admin.email };
}

export async function createSession(adminId: string) {
  const id = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await query(`insert into session (id, admin_id, expires_at) values ($1, $2, $3)`, [id, adminId, expires]);
  return { id, expires };
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function destroySession(id: string) {
  await query(`delete from session where id = $1`, [id]);
}

/** The signed-in admin for this request, or null. Cheap: one indexed lookup. */
export async function currentAdmin(): Promise<Admin | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return one<Admin>(
    `select a.id, a.email from session s join admin a on a.id = s.admin_id where s.id = $1 and s.expires_at > now()`,
    [id],
  );
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) throw new Unauthorized();
  return admin;
}

export class Unauthorized extends Error {
  status = 401;
  constructor() {
    super("Sign in first.");
  }
}
