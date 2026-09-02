#!/usr/bin/env node
// Seeds the demo galleries from the prototype (two albums, one draft, two client galleries) through
// the real API, so it exercises the same upload pipeline the Studio uses. Opt-in only:
//   ADMIN_PASSWORD=... SITE_URL=http://localhost:3000 npm run seed:demo
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(here, "..", "public", "photos");
const site = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const password = process.env.ADMIN_PASSWORD;
if (!password) { console.error("Set ADMIN_PASSWORD to the Studio password."); process.exit(1); }

const login = await fetch(`${site}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
if (!login.ok) { console.error("Could not sign in:", login.status, await login.text()); process.exit(1); }
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
const H = { Cookie: cookie };
const J = { ...H, "Content-Type": "application/json" };

async function upload(name) {
  const buf = await readFile(path.join(photosDir, name));
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/jpeg" }), name);
  const res = await fetch(`${site}/api/admin/photos`, { method: "POST", headers: H, body: fd });
  if (!res.ok) throw new Error(`upload ${name}: ${res.status} ${await res.text()}`);
  const p = await res.json();
  console.log(`  ${name} → ${p.id}${p.existed ? " (already there)" : ""}`);
  return p.id;
}

console.log("Uploading placeholder photographs…");
const ids = {};
for (const f of ["family-beach", "portrait-hat", "couple-canal", "senior-golden", "senior-bridge", "street-alley", "city-bw"]) ids[f] = await upload(`${f}.jpg`);

async function post(pathname, body) {
  const res = await fetch(`${site}${pathname}`, { method: "POST", headers: J, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${pathname}: ${res.status} ${await res.text()}`);
  return res.json();
}

console.log("Creating albums…");
await post("/api/admin/albums", { name: "Places I keep going back to", subtitle: "Ongoing", live: true, photos: [{ photo_id: ids["street-alley"] }, { photo_id: ids["city-bw"] }, { photo_id: ids["couple-canal"], caption: "quiet water, early" }] });
await post("/api/admin/albums", { name: "Seniors", subtitle: "Class of 2026", live: true, photos: [{ photo_id: ids["senior-golden"], caption: "she picked the field herself" }, { photo_id: ids["senior-bridge"] }, { photo_id: ids["portrait-hat"] }] });
await post("/api/admin/albums", { name: "Families, at home", subtitle: "Tulsa · morning light", live: false, photos: [{ photo_id: ids["family-beach"], caption: "the last hour of the day" }, { photo_id: ids["portrait-hat"] }, { photo_id: ids["couple-canal"] }] });

console.log("Creating client galleries…");
const until = (d) => new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10);
await post("/api/admin/client-galleries", { client_name: "Renner + Mae", access_word: "loveletter", shot_on: "2026-07-19", expires_on: until(45), note: "Everything from the day is here. Take your time.", photos: [ids["couple-canal"], ids["city-bw"], ids["portrait-hat"], ids["family-beach"]].map((photo_id) => ({ photo_id })) });
await post("/api/admin/client-galleries", { client_name: "The Hartleys", access_word: "goldenfield", shot_on: "2026-08-09", expires_on: until(90), note: "Mark the ones you'd like printed and I'll get them ordered. The full-size files are yours to keep — I'd back them up somewhere that isn't a phone.", photos: [ids["family-beach"], ids["portrait-hat"], ids["senior-golden"], ids["couple-canal"], ids["senior-bridge"], ids["street-alley"]].map((photo_id) => ({ photo_id })) });

console.log("Done. Client words: goldenfield, loveletter.");
