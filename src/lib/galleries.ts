import "server-only";
import { many, one } from "./db";

export type ClientGallery = {
  id: string; slug: string; client_name: string; access_word: string; link_token: string;
  shot_on: string | null; expires_on: string; note: string; position: number;
  first_opened_at: string | null; downloads: number; photo_count: number; marked_count: number; updated_at: string;
};
export type GalleryPhoto = { photo_id: string; position: number; width: number; height: number; original_name: string; content_type: string };

const SELECT = `
  select g.id, g.slug, g.client_name, g.access_word, g.link_token,
         to_char(g.shot_on, 'YYYY-MM-DD') as shot_on, to_char(g.expires_on, 'YYYY-MM-DD') as expires_on,
         g.note, g.position, g.first_opened_at, g.downloads, g.updated_at,
         (select count(*)::int from client_gallery_photo gp where gp.gallery_id = g.id) as photo_count,
         (select count(*)::int from favourite f where f.gallery_id = g.id) as marked_count
  from client_gallery g`;

export function allClientGalleries() {
  return many<ClientGallery>(`${SELECT} order by g.position, g.created_at desc`);
}
export function galleryById(id: string) {
  return one<ClientGallery>(`${SELECT} where g.id = $1`, [id]);
}
export function galleryBySlug(slug: string) {
  return one<ClientGallery>(`${SELECT} where g.slug = $1`, [slug]);
}
/** An unexpired gallery matching a typed word, a slug, or a link token. Expired ones are invisible. */
export function unlockGallery(word: string) {
  const w = word.trim().toLowerCase();
  if (!w) return Promise.resolve(null);
  return one<ClientGallery>(
    `${SELECT} where g.expires_on >= current_date and (g.access_word = $1 or g.slug = $1 or g.link_token = $2) order by g.updated_at desc limit 1`,
    [w, word.trim()],
  );
}
/** A gallery the visitor holds a grant for, provided it has not expired since. */
export function openGallery(id: string) {
  return one<ClientGallery>(`${SELECT} where g.id = $1 and g.expires_on >= current_date`, [id]);
}
export function galleryPhotos(galleryId: string) {
  return many<GalleryPhoto>(
    `select gp.photo_id, gp.position, p.width, p.height, p.original_name, p.content_type
     from client_gallery_photo gp join photo p on p.id = gp.photo_id where gp.gallery_id = $1 order by gp.position`,
    [galleryId],
  );
}
export function galleryFavourites(galleryId: string) {
  return many<{ photo_id: string }>(`select photo_id from favourite where gallery_id = $1`, [galleryId]).then((r) => r.map((x) => x.photo_id));
}
export function isExpired(g: { expires_on: string }) {
  return g.expires_on < new Date().toISOString().slice(0, 10);
}
/** Public shape of a gallery — never includes the word or the link token. */
export function publicGallery(g: ClientGallery) {
  return { id: g.id, slug: g.slug, client_name: g.client_name, shot_on: g.shot_on, expires_on: g.expires_on, note: g.note, share_path: `/g/${g.link_token}` };
}
export type PublicGallery = ReturnType<typeof publicGallery>;
