import "server-only";
import { many, one } from "./db";

export type AlbumSummary = {
  id: string; slug: string; name: string; subtitle: string; live: boolean; position: number;
  cover_photo_id: string | null; photo_count: number; updated_at: string;
};
export type AlbumPhoto = { photo_id: string; caption: string; width: number; height: number; position: number };

const SUMMARY = `
  select a.id, a.slug, a.name, a.subtitle, a.live, a.position, a.updated_at,
         coalesce(a.cover_photo_id, (select ap.photo_id from album_photo ap where ap.album_id = a.id order by ap.position limit 1)) as cover_photo_id,
         (select count(*)::int from album_photo ap where ap.album_id = a.id) as photo_count
  from album a`;

export function liveAlbums() {
  return many<AlbumSummary>(`${SUMMARY} where a.live order by a.position, a.created_at desc`);
}
export function allAlbums() {
  return many<AlbumSummary>(`${SUMMARY} order by a.position, a.created_at desc`);
}
export function albumBySlug(slug: string, liveOnly: boolean) {
  return one<AlbumSummary>(`${SUMMARY} where a.slug = $1 ${liveOnly ? "and a.live" : ""}`, [slug]);
}
export function albumById(id: string) {
  return one<AlbumSummary>(`${SUMMARY} where a.id = $1`, [id]);
}
export function albumPhotos(albumId: string) {
  return many<AlbumPhoto>(
    `select ap.photo_id, ap.caption, ap.position, p.width, p.height
     from album_photo ap join photo p on p.id = ap.photo_id where ap.album_id = $1 order by ap.position`,
    [albumId],
  );
}
