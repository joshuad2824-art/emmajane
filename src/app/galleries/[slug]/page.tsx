import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { albumBySlug, albumPhotos } from "@/lib/albums";
import { currentAdmin } from "@/lib/auth";
import { AlbumMosaic } from "./AlbumMosaic";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await albumBySlug(slug, true).catch(() => null);
  return album ? { title: album.name, description: album.subtitle || undefined } : { title: "Gallery" };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const admin = await currentAdmin().catch(() => null);
  const album = await albumBySlug(slug, !admin).catch(() => null); // Emma can preview a draft
  if (!album) notFound();
  const photos = await albumPhotos(album.id);

  return (
    <>
      <header className="wrap wrap--48" style={{ paddingTop: 76, paddingBottom: 40 }}>
        <Link href="/galleries" className="eyebrow eyebrow--wider" style={{ textDecoration: "none" }}>← All galleries</Link>
        <h1 className="h1 balance" style={{ marginTop: 22, fontSize: "4rem", maxWidth: "24ch" }}>{album.name}</h1>
        {album.subtitle ? <p className="aside aside--muted aside--lede" style={{ marginTop: 14 }}>{album.subtitle}</p> : null}
        {!album.live ? <p className="eyebrow eyebrow--wider" style={{ marginTop: 14 }}>Draft — only you can see this</p> : null}
      </header>
      <section className="wrap wrap--48" style={{ paddingBottom: 110 }}>
        {photos.length === 0 ? (
          <p className="aside aside--muted aside--lede">Nothing here yet. Plenty of time.</p>
        ) : (
          <AlbumMosaic photos={photos.map((p) => ({ id: p.photo_id, caption: p.caption }))} />
        )}
      </section>
      <Footer />
    </>
  );
}
