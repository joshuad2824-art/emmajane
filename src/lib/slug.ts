import { randomBytes } from "node:crypto";

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "gallery";
}

export function shortId(n = 4) {
  return randomBytes(n).toString("hex");
}

export function linkToken() {
  return randomBytes(18).toString("base64url");
}
