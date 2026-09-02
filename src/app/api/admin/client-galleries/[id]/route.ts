import { requireAdmin } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { galleryById, galleryFavourites, galleryPhotos } from "@/lib/galleries";
import { fail, handler, isUuid, json, readJson, str } from "@/lib/http";
import { DATE, normalizeWord } from "../route";

type P = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const g = await galleryById(id);
  if (!g) return fail(404, "No such gallery.");
  const [photos, favourites] = await Promise.all([galleryPhotos(id), galleryFavourites(id)]);
  return json({ ...g, photos, favourites }, { headers: { "Cache-Control": "no-store" } });
});

// PATCH /api/admin/client-galleries/:id — client_name, access_word, shot_on, expires_on, note, position
export const PATCH = handler(async (req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const b = await readJson<{ client_name?: unknown; access_word?: unknown; shot_on?: unknown; expires_on?: unknown; note?: unknown; position?: unknown }>(req);
  const sets: string[] = [];
  const vals: unknown[] = [id];
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  if (b.client_name !== undefined) { const n = str(b.client_name, 120); if (!n) return fail(400, "A name helps you find it again."); add("client_name", n); }
  if (b.access_word !== undefined) {
    const w = normalizeWord(b.access_word);
    if (!w) return fail(400, "They will need a word to get in.");
    const clash = await one(`select 1 from client_gallery where access_word = $1 and expires_on >= current_date and id <> $2`, [w, id]);
    if (clash) return fail(409, "That word already opens another gallery that is still up — pick a different one.");
    add("access_word", w);
  }
  if (b.shot_on !== undefined) add("shot_on", typeof b.shot_on === "string" && DATE.test(b.shot_on) ? b.shot_on : null);
  if (b.expires_on !== undefined) { if (typeof b.expires_on !== "string" || !DATE.test(b.expires_on)) return fail(400, "Bad date."); add("expires_on", b.expires_on); }
  if (b.note !== undefined) add("note", str(b.note, 2000));
  if (typeof b.position === "number") add("position", Math.max(0, Math.floor(b.position)));
  if (!sets.length) return fail(400, "Nothing to change.");
  const r = await query(`update client_gallery set ${sets.join(", ")}, updated_at = now() where id = $1`, vals);
  if (!r.rowCount) return fail(404, "No such gallery.");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: P) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such gallery.");
  const r = await query(`delete from client_gallery where id = $1`, [id]);
  if (!r.rowCount) return fail(404, "No such gallery.");
  return json({ ok: true });
});
