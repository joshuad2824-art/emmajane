import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import { query } from "@/lib/db";
import { grantedGalleryId } from "@/lib/gallery-access";
import { galleryBySlug, galleryFavourites, galleryPhotos, isExpired } from "@/lib/galleries";
import { fail, handler } from "@/lib/http";
import { storage } from "@/lib/storage";

/** A stream that only opens its source when the archive actually starts reading it, so a
 *  400-photograph zip does not hold 400 storage connections open at once. */
class LazySource extends PassThrough {
  private started = false;
  constructor(private open: () => Promise<Readable>) { super(); }
  _read(size: number) {
    if (!this.started) {
      this.started = true;
      this.open().then((s) => { s.on("error", (e) => this.destroy(e)); s.pipe(this); }).catch((e) => this.destroy(e));
    }
    return super._read(size);
  }
}

export function extOf(contentType: string, name: string) {
  const m = /\.([a-z0-9]{2,5})$/i.exec(name);
  if (m) return m[1].toLowerCase().replace("jpeg", "jpg");
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/tiff": "tif" }[contentType] ?? "jpg";
}

// GET /api/client-galleries/:slug/download?scope=all|marked → a streamed zip of the originals
export const GET = handler(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const grant = await grantedGalleryId();
  const gallery = await galleryBySlug(slug);
  if (!gallery || !grant || grant !== gallery.id || isExpired(gallery)) return fail(404, "That one does not open anything.");
  const scope = new URL(req.url).searchParams.get("scope") === "marked" ? "marked" : "all";

  let photos = await galleryPhotos(gallery.id);
  if (scope === "marked") {
    const marked = new Set(await galleryFavourites(gallery.id));
    photos = photos.filter((p) => marked.has(p.photo_id));
  }
  if (!photos.length) return fail(404, scope === "marked" ? "Nothing is marked yet." : "There is nothing to download yet.");

  const keys = await query<{ photo_id: string; storage_key: string }>(
    `select photo_id, storage_key from photo_variant where size = 'print' and photo_id = any($1::uuid[])`, [photos.map((p) => p.photo_id)]);
  const keyOf = new Map(keys.rows.map((k) => [k.photo_id, k.storage_key]));
  const store = storage();

  const archive = archiver("zip", { store: true }); // JPEGs do not compress — store, for speed
  archive.on("warning", (e) => console.warn("[zip]", e.message));
  archive.on("error", (e) => console.error("[zip]", e.message));
  for (const p of photos) {
    const key = keyOf.get(p.photo_id);
    if (!key) continue;
    const name = `${gallery.slug}-${String(p.position + 1).padStart(2, "0")}.${extOf(p.content_type, p.original_name)}`;
    archive.append(new LazySource(() => store.getStream(key)), { name });
  }
  archive.finalize().catch((e) => console.error("[zip] finalize", e.message));
  await query(`update client_gallery set downloads = downloads + 1 where id = $1`, [gallery.id]).catch(() => {});

  const filename = `${gallery.slug}${scope === "marked" ? "-marked" : ""}.zip`;
  return new Response(Readable.toWeb(archive) as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
