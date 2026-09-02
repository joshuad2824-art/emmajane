import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { fail, handler, json } from "@/lib/http";
import { ingestPhoto, photoUrls } from "@/lib/images";

// POST /api/admin/photos  (multipart, field "file") → { id, thumb_url, web_url, width, height, existed }
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const len = Number(req.headers.get("content-length") || 0);
  if (len > env.maxUploadBytes + 64 * 1024) return fail(413, "That file is over 50 MB.");
  let form: FormData;
  try { form = await req.formData(); } catch { return fail(400, "Expected a multipart upload with a `file` field."); }
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "No file was attached.");
  const buf = Buffer.from(await file.arrayBuffer());
  const photo = await ingestPhoto(buf, file.name || "photograph.jpg");
  return json({ id: photo.id, ...photoUrls(photo.id), width: photo.width, height: photo.height, existed: photo.existed }, { status: photo.existed ? 200 : 201 });
});
