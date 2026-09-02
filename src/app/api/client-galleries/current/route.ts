import { NextResponse } from "next/server";
import { GALLERY_COOKIE, grantedGalleryId } from "@/lib/gallery-access";
import { galleryFavourites, galleryPhotos, openGallery, publicGallery } from "@/lib/galleries";
import { fail, handler, json } from "@/lib/http";

// GET /api/client-galleries/current — the gallery this visitor's cookie opens, if any
export const GET = handler(async () => {
  const id = await grantedGalleryId();
  const gallery = id ? await openGallery(id) : null;
  if (!gallery) return fail(404, "No gallery is open.");
  const [photos, favourites] = await Promise.all([galleryPhotos(gallery.id), galleryFavourites(gallery.id)]);
  return json({ gallery: publicGallery(gallery), photos: photos.map((p) => ({ id: p.photo_id, width: p.width, height: p.height })), favourites }, { headers: { "Cache-Control": "no-store" } });
});

// DELETE — "Close the gallery"
export const DELETE = handler(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GALLERY_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
