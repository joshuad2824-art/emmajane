import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __ejPool: Pool | undefined;
}

function sslFor(url: string) {
  if (/sslmode=disable/.test(url) || /\.(flycast|internal)\b/.test(url) || /localhost|127\.0\.0\.1/.test(url)) return false;
  return { rejectUnauthorized: false };
}

/** One pool per process, created on first use (so `next build` never needs a database). */
export function pool(): Pool {
  if (globalThis.__ejPool) return globalThis.__ejPool;
  if (!env.databaseUrl) throw new Error("DATABASE_URL is not set");
  globalThis.__ejPool = new Pool({ connectionString: env.databaseUrl, ssl: sslFor(env.databaseUrl), max: 8 });
  return globalThis.__ejPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return pool().query<T>(text, params);
}

export async function one<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const r = await pool().query<T>(text, params);
  return r.rows[0] ?? null;
}

export async function many<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool().query<T>(text, params);
  return r.rows;
}

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
