import { requireAdmin } from "@/lib/auth";
import { withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";
import { normalizePhotos } from "../../route";

// PUT /api/admin/albums/:id/photos { photos: [{ photo_id, caption }] } — the full ordered list, idempotent
export const PUT = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const { photos: raw } = await readJson<{ photos?: unknown }>(req);
  const photos = normalizePhotos(raw);
  if (!photos) return fail(400, "Bad photo list.");
  await withTx(async (c) => {
    const exists = await c.query(`select cover_photo_id from album where id = $1 for update`, [id]);
    if (!exists.rowCount) throw Object.assign(new Error("No such gallery."), { status: 404 });
    await c.query(`delete from album_photo where album_id = $1`, [id]);
    for (const [i, p] of photos.entries()) {
      await c.query(`insert into album_photo (album_id, photo_id, position, caption) values ($1,$2,$3,$4)`, [id, p.photo_id, i, p.caption]);
    }
    const cover = exists.rows[0].cover_photo_id as string | null;
    const keep = cover && photos.some((p) => p.photo_id === cover) ? cover : photos[0]?.photo_id ?? null;
    await c.query(`update album set cover_photo_id = $2, updated_at = now() where id = $1`, [id, keep]);
  });
  return json({ ok: true, count: photos.length });
});
