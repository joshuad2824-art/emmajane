import { grantedGalleryId } from "@/lib/gallery-access";
import { galleryBySlug, galleryFavourites, galleryPhotos, isExpired, publicGallery } from "@/lib/galleries";
import { fail, handler, json } from "@/lib/http";

// GET /api/client-galleries/:slug — requires the access cookie for that gallery
export const GET = handler(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const grant = await grantedGalleryId();
  const gallery = await galleryBySlug(slug);
  if (!gallery || !grant || grant !== gallery.id || isExpired(gallery)) return fail(404, "That one does not open anything.");
  const [photos, favourites] = await Promise.all([galleryPhotos(gallery.id), galleryFavourites(gallery.id)]);
  return json({ gallery: publicGallery(gallery), photos: photos.map((p) => ({ id: p.photo_id, width: p.width, height: p.height })), favourites }, { headers: { "Cache-Control": "no-store" } });
});
