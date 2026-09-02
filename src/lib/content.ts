import "server-only";
import { cache } from "react";
import { many } from "./db";

export type ContentMap = Record<string, { kind: "text" | "image"; value: string }>;

/** Every CMS override, loaded once per request (hundreds of rows at most). */
export const getContent = cache(async (): Promise<ContentMap> => {
  try {
    const rows = await many<{ key: string; kind: "text" | "image"; value: string }>(`select key, kind, value from content`);
    const map: ContentMap = {};
    for (const r of rows) map[r.key] = { kind: r.kind, value: r.value };
    return map;
  } catch (e) {
    // A fresh deploy before the database exists should still render the finished site.
    if (process.env.DATABASE_URL) console.error("[content] could not load overrides:", (e as Error).message);
    return {};
  }
});

export async function textFor(key: string, fallback: string) {
  const c = await getContent();
  const v = c[key];
  return v && v.kind === "text" ? v.value : fallback;
}

export async function imageFor(key: string, fallbackSrc: string) {
  const c = await getContent();
  const v = c[key];
  return v && v.kind === "image" ? `/api/photos/${v.value}/web` : fallbackSrc;
}
