import { Readable } from "node:stream";
import { currentAdmin } from "@/lib/auth";
import { one } from "@/lib/db";
import { grantedGalleryId } from "@/lib/gallery-access";
import { fail, handler, isUuid } from "@/lib/http";
import { storage } from "@/lib/storage";

type Row = { storage_key: string; content_type: string; bytes: string; is_public: boolean; granted: boolean };

/**
 * GET /api/photos/:id/(thumb|web)
 * A photograph is served when it is public (used on a page or in a live album), when the visitor
 * holds a grant for a client gallery that contains it, or when Emma is signed in. Otherwise 404 —
 * never 403, so nothing confirms that a private photograph exists.
 */
export const GET = handler(async (_req: Request, { params }: { params: Promise<{ id: string; size: string }> }) => {
  const { id, size } = await params;
  if (!isUuid(id) || !["thumb", "web", "print"].includes(size)) return fail(404, "Not found.");
  const admin = await currentAdmin();
  if (size === "print" && !admin) return fail(404, "Not found.");
  const grant = admin ? null : await grantedGalleryId();

  const row = await one<Row>(
    `select v.storage_key, case when v.size = 'print' then p.content_type else 'image/jpeg' end as content_type, v.bytes::text as bytes,
       ( exists (select 1 from content c where c.kind = 'image' and c.value = p.id::text)
         or exists (select 1 from album_photo ap join album a on a.id = ap.album_id where ap.photo_id = p.id and a.live)
         or exists (select 1 from album a where a.cover_photo_id = p.id and a.live) ) as is_public,
       exists (select 1 from client_gallery_photo gp join client_gallery g on g.id = gp.gallery_id
               where gp.photo_id = p.id and g.id = $3::uuid and g.expires_on >= current_date) as granted
     from photo p join photo_variant v on v.photo_id = p.id and v.size = $2
     where p.id = $1`,
    [id, size, grant],
  );
  if (!row) return fail(404, "Not found.");
  const allowed = !!admin || row.is_public || row.granted;
  if (!allowed) return fail(404, "Not found.");

  let stream: Readable;
  try { stream = await storage().getStream(row.storage_key); } catch { return fail(404, "Not found."); }
  const headers: Record<string, string> = {
    "Content-Type": row.content_type,
    "Content-Length": row.bytes,
    // Ids are immutable, so public derivatives can be cached hard; private ones only in the visitor's own browser.
    "Cache-Control": row.is_public && !admin ? "public, max-age=31536000, immutable" : "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, { headers });
});
