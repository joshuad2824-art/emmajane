import { requireAdmin } from "@/lib/auth";
import { withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";

// PUT /api/admin/albums/order { ids: [...] } — the list order is the display order
export const PUT = handler(async (req: Request) => {
  await requireAdmin();
  const { ids } = await readJson<{ ids?: unknown }>(req);
  if (!Array.isArray(ids) || !ids.every(isUuid)) return fail(400, "Send an array of album ids.");
  await withTx(async (c) => {
    for (const [i, id] of (ids as string[]).entries()) await c.query(`update album set position = $2 where id = $1`, [id, i]);
  });
  return json({ ok: true });
});
