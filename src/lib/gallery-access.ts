import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export const GALLERY_COOKIE = "ej_gallery";
const MAX_DAYS = 30;

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");
}

/** Build the scoped access cookie for one gallery: expires at the earlier of 30 days and expires_on. */
export function galleryGrant(galleryId: string, expiresOn: string) {
  const byPolicy = Date.now() + MAX_DAYS * 86400_000;
  const byGallery = new Date(`${expiresOn}T23:59:59Z`).getTime();
  const exp = Math.min(byPolicy, isNaN(byGallery) ? byPolicy : byGallery);
  const payload = `${galleryId}.${exp}`;
  return {
    value: `${payload}.${sign(payload)}`,
    options: { httpOnly: true, secure: env.isProd, sameSite: "lax" as const, path: "/", expires: new Date(exp) },
  };
}

/** The gallery id this request has been granted, or null. Expiry of the gallery itself is re-checked by callers. */
export async function grantedGalleryId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(GALLERY_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (Number(exp) < Date.now()) return null;
  const expected = sign(`${id}.${exp}`);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
