import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { one, query, withTx } from "./db";
import { storage } from "./storage";
import { HttpError } from "./http";
import { env } from "./env";

export type PhotoRow = { id: string; width: number; height: number; original_name: string; content_type: string; bytes: number };

const VARIANTS = [
  { size: "thumb", max: 520, quality: 80 },
  { size: "web", max: 2400, quality: 88 },
] as const;

function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a) || (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00)) return { mime: "image/tiff", ext: "tif" };
  return null;
}

/**
 * Store an upload: validate, dedupe by hash, keep the original untouched, and generate
 * EXIF-stripped, orientation-corrected derivatives. Returns the photo row (existing or new).
 */
export async function ingestPhoto(buf: Buffer, originalName: string): Promise<PhotoRow & { existed: boolean }> {
  if (buf.length === 0) throw new HttpError(400, "That file was empty.");
  if (buf.length > env.maxUploadBytes) throw new HttpError(413, "That file is over 50 MB.");
  const kind = sniff(buf);
  if (!kind) throw new HttpError(415, "Only JPEG, PNG, WebP and TIFF photographs can be uploaded.");

  const hash = createHash("sha256").update(buf).digest("hex");
  const existing = await one<PhotoRow>(
    `select id, width, height, original_name, content_type, bytes from photo where content_hash = $1`,
    [hash],
  );
  if (existing) return { ...existing, existed: true };

  const base = sharp(buf, { failOn: "none" }).rotate(); // honour EXIF orientation, then drop the metadata
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new HttpError(415, "That file could not be read as a photograph.");
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;

  const id = crypto.randomUUID();
  const dir = `photos/${id.slice(0, 2)}/${id}`;
  const originalKey = `${dir}/original.${kind.ext}`;
  const store = storage();

  const derivatives: { size: string; key: string; width: number; height: number; bytes: number; buf: Buffer }[] = [];
  for (const v of VARIANTS) {
    const out = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: v.max, height: v.max, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: v.quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    derivatives.push({ size: v.size, key: `${dir}/${v.size}.jpg`, width: out.info.width, height: out.info.height, bytes: out.info.size, buf: out.data });
  }

  await store.put(originalKey, buf, kind.mime);
  for (const d of derivatives) await store.put(d.key, d.buf, "image/jpeg");

  const safeName = originalName.replace(/[\\/:*?"<>|\r\n]/g, "").slice(0, 200) || `photograph.${kind.ext}`;
  try {
    await withTx(async (c) => {
      await c.query(
        `insert into photo (id, storage_key, original_name, content_type, width, height, bytes, content_hash) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, originalKey, safeName, kind.mime, width, height, buf.length, hash],
      );
      await c.query(
        `insert into photo_variant (photo_id, size, storage_key, width, height, bytes) values ($1,'print',$2,$3,$4,$5)`,
        [id, originalKey, width, height, buf.length],
      );
      for (const d of derivatives) {
        await c.query(
          `insert into photo_variant (photo_id, size, storage_key, width, height, bytes) values ($1,$2,$3,$4,$5,$6)`,
          [id, d.size, d.key, d.width, d.height, d.bytes],
        );
      }
    });
  } catch (e: unknown) {
    // A concurrent upload of the same bytes won the race: reuse its row and drop our copies.
    const dup = await one<PhotoRow>(`select id, width, height, original_name, content_type, bytes from photo where content_hash = $1`, [hash]);
    await Promise.all([store.delete(originalKey), ...derivatives.map((d) => store.delete(d.key))]);
    if (dup) return { ...dup, existed: true };
    throw e;
  }

  return { id, width, height, original_name: safeName, content_type: kind.mime, bytes: buf.length, existed: false };
}

export function photoUrls(id: string) {
  return { thumb_url: `/api/photos/${id}/thumb`, web_url: `/api/photos/${id}/web` };
}

/** Delete a photo and its objects, but only when nothing references it. */
export async function deletePhotoIfUnreferenced(id: string): Promise<"deleted" | "referenced" | "missing"> {
  const ref = await one<{ n: number }>(
    `select (
       (select count(*) from album_photo where photo_id = $1) +
       (select count(*) from client_gallery_photo where photo_id = $1) +
       (select count(*) from album where cover_photo_id = $1) +
       (select count(*) from content where kind = 'image' and value = $1::text)
     )::int as n`,
    [id],
  );
  if (!ref) return "missing";
  if (ref.n > 0) return "referenced";
  const variants = (await query<{ storage_key: string }>(`select storage_key from photo_variant where photo_id = $1`, [id])).rows;
  const photo = await one<{ storage_key: string }>(`select storage_key from photo where id = $1`, [id]);
  if (!photo) return "missing";
  await query(`delete from photo where id = $1`, [id]);
  const keys = new Set([photo.storage_key, ...variants.map((v) => v.storage_key)]);
  const store = storage();
  await Promise.all([...keys].map((k) => store.delete(k).catch(() => {})));
  return "deleted";
}
