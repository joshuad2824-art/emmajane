import { query } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET() {
  let db = "ok";
  try { await query("select 1"); } catch (e) { db = `error: ${(e as Error).message}`; }
  return Response.json({ ok: true, db, storage: storage().kind }, { headers: { "Cache-Control": "no-store" } });
}
