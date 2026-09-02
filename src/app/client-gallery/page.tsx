import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { grantedGalleryId } from "@/lib/gallery-access";
import { galleryFavourites, galleryPhotos, openGallery, publicGallery } from "@/lib/galleries";
import { ClientGalleryView, type GalleryPayload } from "./ClientGalleryView";

export const metadata: Metadata = { title: "Your gallery", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ClientGalleryPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  let initial: GalleryPayload | null = null;
  try {
    const id = await grantedGalleryId();
    const gallery = id ? await openGallery(id) : null;
    if (gallery) {
      const [photos, favourites] = await Promise.all([galleryPhotos(gallery.id), galleryFavourites(gallery.id)]);
      initial = { gallery: publicGallery(gallery), photos: photos.map((p) => ({ id: p.photo_id, width: p.width, height: p.height })), favourites };
    }
  } catch (e) {
    console.error("[client-gallery]", (e as Error).message);
  }
  return (
    <>
      <ClientGalleryView initial={initial} autoWord={typeof g === "string" ? g : ""} />
      <Footer />
    </>
  );
}
