import { requireAdmin } from "@/lib/auth";
import { one, withTx } from "@/lib/db";
import { allClientGalleries } from "@/lib/galleries";
import { fail, handler, isUuid, json, readJson, str } from "@/lib/http";
import { linkToken, shortId, slugify } from "@/lib/slug";
import { plusDaysIso } from "@/lib/dates";

export const GET = handler(async () => {
  await requireAdmin();
  return json(await allClientGalleries(), { headers: { "Cache-Control": "no-store" } });
});

export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function normalizeWord(v: unknown) {
  return str(v, 60).toLowerCase().replace(/\s+/g, "");
}
export function normalizeIds(v: unknown): string[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 3000) return null;
  const out: string[] = [];
  for (const p of v as { photo_id?: unknown }[]) if (isUuid(p?.photo_id) && !out.includes(p.photo_id)) out.push(p.photo_id);
  return out;
}

// POST /api/admin/client-galleries
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await readJson<{ client_name?: unknown; access_word?: unknown; shot_on?: unknown; expires_on?: unknown; note?: unknown; photos?: unknown }>(req);
  const name = str(b.client_name, 120);
  if (!name) return fail(400, "A name helps you find it again.");
  const word = normalizeWord(b.access_word);
  if (!word) return fail(400, "They will need a word to get in.");
  const clash = await one(`select client_name from client_gallery where access_word = $1 and expires_on >= current_date`, [word]);
  if (clash) return fail(409, `That word already opens another gallery that is still up — pick a different one.`);
  const shot = typeof b.shot_on === "string" && DATE.test(b.shot_on) ? b.shot_on : null;
  const until = typeof b.expires_on === "string" && DATE.test(b.expires_on) ? b.expires_on : plusDaysIso(90);
  const photos = normalizeIds(b.photos);
  if (!photos) return fail(400, "Bad photo list.");
  let slug = slugify(name);
  if (await one(`select 1 from client_gallery where slug = $1`, [slug])) slug = `${slug}-${shortId(2)}`;
  const id = await withTx(async (c) => {
    await c.query(`update client_gallery set position = position + 1`);
    const r = await c.query<{ id: string }>(
      `insert into client_gallery (slug, client_name, access_word, link_token, shot_on, expires_on, note, position) values ($1,$2,$3,$4,$5,$6,$7,0) returning id`,
      [slug, name, word, linkToken(), shot, until, str(b.note, 2000)],
    );
    for (const [i, pid] of photos.entries()) await c.query(`insert into client_gallery_photo (gallery_id, photo_id, position) values ($1,$2,$3)`, [r.rows[0].id, pid, i]);
    return r.rows[0].id;
  });
  return json({ id, slug }, { status: 201 });
});
