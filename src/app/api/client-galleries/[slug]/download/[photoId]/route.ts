import { Readable } from "node:stream";
import { one, query } from "@/lib/db";
import { grantedGalleryId } from "@/lib/gallery-access";
import { galleryBySlug, isExpired } from "@/lib/galleries";
import { fail, handler, isUuid } from "@/lib/http";
import { storage } from "@/lib/storage";
import { extOf } from "../route";

// GET /api/client-galleries/:slug/download/:photoId → the untouched original, named <client-slug>-NN.jpg
export const GET = handler(async (_req: Request, { params }: { params: Promise<{ slug: string; photoId: string }> }) => {
  const { slug, photoId } = await params;
  if (!isUuid(photoId)) return fail(404, "Not found.");
  const grant = await grantedGalleryId();
  const gallery = await galleryBySlug(slug);
  if (!gallery || !grant || grant !== gallery.id || isExpired(gallery)) return fail(404, "That one does not open anything.");
  const row = await one<{ storage_key: string; content_type: string; bytes: string; position: number; original_name: string }>(
    `select v.storage_key, p.content_type, v.bytes::text as bytes, gp.position, p.original_name
     from client_gallery_photo gp join photo p on p.id = gp.photo_id join photo_variant v on v.photo_id = p.id and v.size = 'print'
     where gp.gallery_id = $1 and gp.photo_id = $2`, [gallery.id, photoId]);
  if (!row) return fail(404, "Not found.");
  let stream: Readable;
  try { stream = await storage().getStream(row.storage_key); } catch { return fail(404, "Not found."); }
  await query(`update client_gallery set downloads = downloads + 1 where id = $1`, [gallery.id]).catch(() => {});
  const name = `${gallery.slug}-${String(row.position + 1).padStart(2, "0")}.${extOf(row.content_type, row.original_name)}`;
  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": row.content_type,
      "Content-Length": row.bytes,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
