#!/usr/bin/env node
// Runs db/migrations/*.sql in order (tracked in schema_migration), then makes sure the single
// admin row exists. Runs on every boot before `next start`; safe to re-run.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { hashPassword } from "../src/lib/password.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "db", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. On Fly: `fly postgres attach <db-app>` or `fly secrets set DATABASE_URL=...`.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, ssl: sslFor(url), max: 2 });

function sslFor(u) {
  // Fly Postgres over the private network (*.flycast / *.internal) does not use TLS; hosted
  // providers (Neon, Supabase) do. Honour an explicit sslmode if the URL carries one.
  if (/sslmode=disable/.test(u) || /\.(flycast|internal)\b/.test(u) || /localhost|127\.0\.0\.1/.test(u)) return false;
  return { rejectUnauthorized: false };
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`create table if not exists schema_migration (name text primary key, applied_at timestamptz not null default now())`);
    const applied = new Set((await client.query(`select name from schema_migration`)).rows.map((r) => r.name));
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    for (const f of files) {
      if (applied.has(f)) continue;
      const sql = await readFile(path.join(migrationsDir, f), "utf8");
      console.log(`migrate: applying ${f}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(`insert into schema_migration (name) values ($1)`, [f]);
        await client.query("commit");
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    }

    const { rows } = await client.query(`select count(*)::int as n from admin`);
    if (rows[0].n === 0) {
      const pw = process.env.ADMIN_PASSWORD;
      const email = process.env.ADMIN_EMAIL || "hello@emmajanephoto.com";
      if (!pw) {
        console.warn("migrate: no admin exists and ADMIN_PASSWORD is not set — the Studio cannot be signed into until it is.");
      } else if (pw.length < 10) {
        console.warn("migrate: ADMIN_PASSWORD is shorter than 10 characters — refusing to create the admin with it.");
      } else {
        await client.query(`insert into admin (email, password_hash) values ($1, $2)`, [email, hashPassword(pw)]);
        console.log(`migrate: created the admin account for ${email}`);
      }
    }
    await client.query(`delete from session where expires_at < now()`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("migrate failed:", e);
  process.exit(1);
});
