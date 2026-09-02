import { requireAdmin } from "@/lib/auth";
import { fail, handler, isUuid, json } from "@/lib/http";
import { deletePhotoIfUnreferenced } from "@/lib/images";

// DELETE /api/admin/photos/:id — only when nothing references it
export const DELETE = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return fail(400, "Bad photo id.");
  const result = await deletePhotoIfUnreferenced(id);
  if (result === "referenced") return fail(409, "That photograph is still in use.");
  if (result === "missing") return fail(404, "No such photograph.");
  return json({ ok: true });
});
