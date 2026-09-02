import { albumById, albumPhotos } from "@/lib/albums";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { fail, handler, isUuid, json, readJson, str } from "@/lib/http";

type P = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const album = await albumById(id);
  if (!album) return fail(404, "No such gallery.");
  return json({ ...album, photos: await albumPhotos(id) }, { headers: { "Cache-Control": "no-store" } });
});

// PATCH /api/admin/albums/:id — name, subtitle, live, cover_photo_id, position (any subset)
export const PATCH = handler(async (req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const b = await readJson<{ name?: unknown; subtitle?: unknown; live?: unknown; cover_photo_id?: unknown; position?: unknown }>(req);
  const sets: string[] = [];
  const vals: unknown[] = [id];
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  if (b.name !== undefined) { const n = str(b.name, 120); if (!n) return fail(400, "A gallery needs a name."); add("name", n); }
  if (b.subtitle !== undefined) add("subtitle", str(b.subtitle, 200));
  if (b.live !== undefined) add("live", b.live === true);
  if (b.cover_photo_id !== undefined) add("cover_photo_id", isUuid(b.cover_photo_id) ? b.cover_photo_id : null);
  if (typeof b.position === "number") add("position", Math.max(0, Math.floor(b.position)));
  if (!sets.length) return fail(400, "Nothing to change.");
  const r = await query(`update album set ${sets.join(", ")}, updated_at = now() where id = $1`, vals);
  if (!r.rowCount) return fail(404, "No such gallery.");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const r = await query(`delete from album where id = $1`, [id]);
  if (!r.rowCount) return fail(404, "No such gallery.");
  return json({ ok: true });
});
