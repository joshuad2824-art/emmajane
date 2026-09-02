import { requireAdmin } from "@/lib/auth";
import { many } from "@/lib/db";
import { handler, json } from "@/lib/http";

export const GET = handler(async () => {
  await requireAdmin();
  const rows = await many(`select id, name, email, phone, session_type, to_char(preferred_date, 'YYYY-MM-DD') as preferred_date, location, message, opt_in, created_at, read_at from inquiry order by created_at desc limit 500`);
  return json(rows, { headers: { "Cache-Control": "no-store" } });
});
