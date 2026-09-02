import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { fail, handler, isUuid, json, readJson } from "@/lib/http";

// PATCH /api/admin/inquiries/:id { read: boolean }
export const PATCH = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "No such note.");
  const { read } = await readJson<{ read?: unknown }>(req);
  const r = await query(`update inquiry set read_at = case when $2 then now() else null end where id = $1`, [id, read === true]);
  if (!r.rowCount) return fail(404, "No such note.");
  return json({ ok: true });
});
