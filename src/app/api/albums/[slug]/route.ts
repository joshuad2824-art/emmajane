import { albumBySlug, albumPhotos } from "@/lib/albums";
import { fail, handler, json } from "@/lib/http";

// GET /api/albums/:slug — one live album with its photographs in order
export const GET = handler(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const album = await albumBySlug(slug, true);
  if (!album) return fail(404, "No such gallery.");
  const photos = await albumPhotos(album.id);
  return json({
    slug: album.slug, name: album.name, subtitle: album.subtitle,
    photos: photos.map((p) => ({ id: p.photo_id, caption: p.caption, width: p.width, height: p.height, thumb_url: `/api/photos/${p.photo_id}/thumb`, web_url: `/api/photos/${p.photo_id}/web` })),
  });
});
