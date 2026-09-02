import { requireAdmin } from "@/lib/auth";
import { withTx } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";

export const PUT = handler(async (req: Request) => {
  await requireAdmin();
  const { ids } = await readJson<{ ids?: unknown }>(req);
  if (!Array.isArray(ids) || !ids.every(isUuid)) return fail(400, "Send an array of gallery ids.");
  await withTx(async (c) => {
    for (const [i, id] of (ids as string[]).entries()) await c.query(`update client_gallery set position = $2 where id = $1`, [id, i]);
  });
  return json({ ok: true });
});
