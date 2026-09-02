import { NextResponse } from "next/server";
import { GALLERY_COOKIE, galleryGrant } from "@/lib/gallery-access";
import { unlockGallery } from "@/lib/galleries";
import { query } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// The opaque link Emma copies from the Studio: /g/<token> → grant + redirect to the gallery.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(req.url);
  const to = new URL("/client-gallery", url.origin);
  const limit = rateLimit(`g:${clientIp(req)}`, 30, 15 * 60_000);
  if (!limit.ok) return NextResponse.redirect(to);
  const gallery = await unlockGallery(token).catch(() => null);
  if (!gallery) return NextResponse.redirect(to);
  const res = NextResponse.redirect(to);
  const grant = galleryGrant(gallery.id, gallery.expires_on);
  res.cookies.set(GALLERY_COOKIE, grant.value, grant.options);
  await query(`update client_gallery set first_opened_at = coalesce(first_opened_at, now()) where id = $1`, [gallery.id]).catch(() => {});
  return res;
}
