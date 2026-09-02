import { allAlbums } from "@/lib/albums";
import { requireAdmin } from "@/lib/auth";
import { one, withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson, str } from "@/lib/http";
import { shortId, slugify } from "@/lib/slug";

export const GET = handler(async () => {
  await requireAdmin();
  return json(await allAlbums(), { headers: { "Cache-Control": "no-store" } });
});

type Body = { name?: unknown; subtitle?: unknown; live?: unknown; cover_photo_id?: unknown; photos?: unknown };

// POST /api/admin/albums — new albums land at the top of the list
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const b = await readJson<Body>(req);
  const name = str(b.name, 120);
  if (!name) return fail(400, "A gallery needs a name.");
  const photos = normalizePhotos(b.photos);
  if (!photos) return fail(400, "Bad photo list.");
  const cover = isUuid(b.cover_photo_id) ? b.cover_photo_id : photos[0]?.photo_id ?? null;
  let slug = slugify(name);
  if (await one(`select 1 from album where slug = $1`, [slug])) slug = `${slug}-${shortId(2)}`;
  const id = await withTx(async (c) => {
    await c.query(`update album set position = position + 1`);
    const r = await c.query<{ id: string }>(
      `insert into album (slug, name, subtitle, live, cover_photo_id, position) values ($1,$2,$3,$4,$5,0) returning id`,
      [slug, name, str(b.subtitle, 200), b.live === true, cover && photos.some((p) => p.photo_id === cover) ? cover : null],
    );
    for (const [i, p] of photos.entries()) {
      await c.query(`insert into album_photo (album_id, photo_id, position, caption) values ($1,$2,$3,$4)`, [r.rows[0].id, p.photo_id, i, p.caption]);
    }
    return r.rows[0].id;
  });
  return json({ id, slug }, { status: 201 });
});

export function normalizePhotos(v: unknown): { photo_id: string; caption: string }[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 2000) return null;
  const seen = new Set<string>();
  const out: { photo_id: string; caption: string }[] = [];
  for (const p of v as { photo_id?: unknown; caption?: unknown }[]) {
    if (!isUuid(p?.photo_id) || seen.has(p.photo_id)) continue;
    seen.add(p.photo_id);
    out.push({ photo_id: p.photo_id, caption: str(p.caption, 300) });
  }
  return out;
}
