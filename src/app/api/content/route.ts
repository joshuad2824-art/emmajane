import { many } from "@/lib/db";
import { handler, json } from "@/lib/http";

// GET /api/content?prefix=home.  → { key: value } (text only; image keys resolve to photo ids)
export const GET = handler(async (req: Request) => {
  const prefix = new URL(req.url).searchParams.get("prefix") ?? "";
  const rows = await many<{ key: string; kind: string; value: string }>(`select key, kind, value from content where key like $1 || '%' order by key`, [prefix]);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.kind === "image" ? `/api/photos/${r.value}/web` : r.value;
  return json(out, { headers: { "Cache-Control": "no-store" } });
});
