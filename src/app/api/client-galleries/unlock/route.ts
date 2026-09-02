import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { notify } from "@/lib/email";
import { GALLERY_COOKIE, galleryGrant } from "@/lib/gallery-access";
import { galleryFavourites, galleryPhotos, publicGallery, unlockGallery } from "@/lib/galleries";
import { fail, handler, readJson, str } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// POST /api/client-galleries/unlock { word } → sets the scoped access cookie and returns the gallery
export const POST = handler(async (req: Request) => {
  const limit = rateLimit(`unlock:${clientIp(req)}`, 12, 15 * 60_000);
  if (!limit.ok) return fail(429, "Too many tries for now.");
  const { word } = await readJson<{ word?: unknown }>(req);
  const w = str(word, 200);
  if (!w) return fail(400, "I will need the word first.");
  const gallery = await unlockGallery(w);
  // Wrong word and expired gallery look identical — nothing confirms a gallery ever existed.
  if (!gallery) { await new Promise((r) => setTimeout(r, 300)); return fail(404, "That one does not open anything."); }

  const [photos, favourites] = await Promise.all([galleryPhotos(gallery.id), galleryFavourites(gallery.id)]);
  const res = NextResponse.json({ gallery: publicGallery(gallery), photos: photos.map((p) => ({ id: p.photo_id, width: p.width, height: p.height })), favourites });
  const grant = galleryGrant(gallery.id, gallery.expires_on);
  res.cookies.set(GALLERY_COOKIE, grant.value, grant.options);

  if (!gallery.first_opened_at) {
    await query(`update client_gallery set first_opened_at = now() where id = $1 and first_opened_at is null`, [gallery.id]).catch(() => {});
    notify(`${gallery.client_name} opened their gallery`, `${gallery.client_name} just opened their gallery for the first time.\n\n${photos.length} photographs · here until ${gallery.expires_on}`).catch(() => {});
  }
  return res;
});
