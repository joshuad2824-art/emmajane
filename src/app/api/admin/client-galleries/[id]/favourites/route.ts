import { requireAdmin } from "@/lib/auth";
import { many } from "@/lib/db";
import { fail, handler, isUuid, json } from "@/lib/http";

// GET /api/admin/client-galleries/:id/favourites — what the client marked, in gallery order
export const GET = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const rows = await many<{ photo_id: string; position: number; marked_at: string }>(
    `select f.photo_id, gp.position, f.marked_at from favourite f join client_gallery_photo gp on gp.gallery_id = f.gallery_id and gp.photo_id = f.photo_id
     where f.gallery_id = $1 order by gp.position`, [id]);
  return json(rows.map((r) => ({ ...r, number: String(r.position + 1).padStart(2, "0"), thumb_url: `/api/photos/${r.photo_id}/thumb` })), { headers: { "Cache-Control": "no-store" } });
});
