import { liveAlbums } from "@/lib/albums";
import { handler, json } from "@/lib/http";

// GET /api/albums — live albums in display order, with cover + count
export const GET = handler(async () => {
  const albums = await liveAlbums();
  return json(albums.map((a) => ({ slug: a.slug, name: a.name, subtitle: a.subtitle, photo_count: a.photo_count, cover_url: a.cover_photo_id ? `/api/photos/${a.cover_photo_id}/web` : null })));
});
