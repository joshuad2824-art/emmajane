import { requireAdmin } from "@/lib/auth";
import { withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";
import { normalizeIds } from "../../route";

// PUT /api/admin/client-galleries/:id/photos { photos: [{ photo_id }] } — full ordered list
export const PUT = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const { photos: raw } = await readJson<{ photos?: unknown }>(req);
  const ids = normalizeIds(raw);
  if (!ids) return fail(400, "Bad photo list.");
  await withTx(async (c) => {
    const exists = await c.query(`select 1 from client_gallery where id = $1 for update`, [id]);
    if (!exists.rowCount) throw Object.assign(new Error("No such gallery."), { status: 404 });
    await c.query(`delete from client_gallery_photo where gallery_id = $1`, [id]);
    for (const [i, pid] of ids.entries()) await c.query(`insert into client_gallery_photo (gallery_id, photo_id, position) values ($1,$2,$3)`, [id, pid, i]);
    await c.query(`delete from favourite where gallery_id = $1 and photo_id <> all($2::uuid[])`, [id, ids]);
    await c.query(`update client_gallery set updated_at = now() where id = $1`, [id]);
  });
  return json({ ok: true, count: ids.length });
});
