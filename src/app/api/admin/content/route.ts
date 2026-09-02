import { requireAdmin } from "@/lib/auth";
import { query, withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";

const KEY = /^[a-z0-9]+(\.[a-z0-9-]+){1,6}$/i;

// PATCH /api/admin/content  [{ key, kind, value }]
export const PATCH = handler(async (req: Request) => {
  await requireAdmin();
  const body = await readJson<unknown>(req);
  const items = Array.isArray(body) ? body : [body];
  if (!items.length || items.length > 50) return fail(400, "Send between 1 and 50 edits.");
  for (const it of items as { key?: unknown; kind?: unknown; value?: unknown }[]) {
    if (typeof it.key !== "string" || !KEY.test(it.key)) return fail(400, `Bad content key: ${String(it.key)}`);
    const kind = it.kind === "image" ? "image" : "text";
    if (typeof it.value !== "string" || !it.value.trim()) return fail(400, `Nothing to save for ${it.key}.`);
    if (kind === "image" && !isUuid(it.value)) return fail(400, "An image slot needs a photo id.");
    if (kind === "text" && it.value.length > 5000) return fail(400, "That passage is too long to save.");
  }
  await withTx(async (c) => {
    for (const it of items as { key: string; kind?: string; value: string }[]) {
      const kind = it.kind === "image" ? "image" : "text";
      if (kind === "image") {
        const ok = await c.query(`select 1 from photo where id = $1`, [it.value]);
        if (!ok.rowCount) throw Object.assign(new Error("That photograph does not exist."), { status: 400 });
      }
      await c.query(
        `insert into content (key, kind, value) values ($1, $2, $3)
         on conflict (key) do update set kind = excluded.kind, value = excluded.value, updated_at = now()`,
        [it.key, kind, kind === "text" ? it.value.trim() : it.value],
      );
    }
  });
  return json({ ok: true, saved: items.length });
});

// DELETE /api/admin/content?prefix=home.  → the "Undo my edits" reset for one page
export const DELETE = handler(async (req: Request) => {
  await requireAdmin();
  const prefix = new URL(req.url).searchParams.get("prefix") ?? "";
  if (!/^[a-z0-9]+\.$/i.test(prefix)) return fail(400, "Give a page prefix like `home.`");
  const r = await query(`delete from content where key like $1 || '%'`, [prefix]);
  return json({ ok: true, removed: r.rowCount ?? 0 });
});
