// Password hashing with Node's built-in scrypt — no native dependency to build on Fly.
// Shared by the app (src/lib/auth.ts) and the boot-time bootstrap (scripts/migrate.mjs).
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384, r = 8, p = 1, KEYLEN = 64;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, n, rr, pp, salt, hash] = String(stored).split("$");
    if (scheme !== "scrypt") return false;
    const expected = Buffer.from(hash, "base64");
    const actual = scryptSync(String(password), Buffer.from(salt, "base64"), expected.length, {
      N: Number(n), r: Number(rr), p: Number(pp),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
