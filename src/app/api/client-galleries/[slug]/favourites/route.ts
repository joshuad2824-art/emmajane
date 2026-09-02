import { query } from "@/lib/db";
import { grantedGalleryId } from "@/lib/gallery-access";
import { galleryBySlug, isExpired } from "@/lib/galleries";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";

// POST /api/client-galleries/:slug/favourites { photo_id, marked }
export const POST = handler(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const grant = await grantedGalleryId();
  const gallery = await galleryBySlug(slug);
  if (!gallery || !grant || grant !== gallery.id || isExpired(gallery)) return fail(404, "That one does not open anything.");
  const { photo_id, marked } = await readJson<{ photo_id?: unknown; marked?: unknown }>(req);
  if (!isUuid(photo_id)) return fail(400, "Bad photo id.");
  const inGallery = await query(`select 1 from client_gallery_photo where gallery_id = $1 and photo_id = $2`, [gallery.id, photo_id]);
  if (!inGallery.rowCount) return fail(404, "That photograph is not in this gallery.");
  if (marked === false) await query(`delete from favourite where gallery_id = $1 and photo_id = $2`, [gallery.id, photo_id]);
  else await query(`insert into favourite (gallery_id, photo_id) values ($1, $2) on conflict do nothing`, [gallery.id, photo_id]);
  return json({ ok: true, marked: marked !== false });
});
