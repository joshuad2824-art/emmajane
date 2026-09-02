import type { Metadata } from "next";
import Link from "next/link";
import { Editable } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui";
import { liveAlbums } from "@/lib/albums";

export const metadata: Metadata = { title: "Galleries", description: "Collections Emma keeps adding to — families, seniors, and the places she drives back to on purpose." };
export const dynamic = "force-dynamic";

export default async function GalleriesPage() {
  const albums = await liveAlbums().catch(() => []);
  return (
    <>
      <header className="wrap wrap--48" style={{ paddingTop: 92, paddingBottom: 46 }}>
        <Editable k="galleries.eyebrow" as="p" className="aside aside--muted aside--lede" style={{ marginBottom: 18 }}>collect beautiful moments</Editable>
        <Editable k="galleries.title" as="h1" className="h1 balance" style={{ maxWidth: "22ch" }}>Galleries</Editable>
        <Editable k="galleries.intro" as="p" className="body" style={{ marginTop: 26, maxWidth: "58ch" }} multiline>Collections I keep adding to — families in their own kitchens, seniors in the last hour of light, places I drive back to on purpose. If you are here for your own session, your gallery lives behind the link I sent you.</Editable>
        <div style={{ marginTop: 34 }}>
          <Button href="/client-gallery" variant="secondary" size="lg">Open a client gallery</Button>
        </div>
      </header>

      <section className="wrap wrap--48" style={{ paddingBottom: 110 }}>
        {albums.length === 0 ? (
          <p className="aside aside--muted aside--lede">Nothing published yet. Soon.</p>
        ) : (
          <div className="grid grid-2" style={{ gap: "56px 40px" }}>
            {albums.map((a) => (
              <Link key={a.id} href={`/galleries/${a.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }} className="rise">
                <div className="hover-zoom">
                  {a.cover_photo_id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/photos/${a.cover_photo_id}/web`} alt={a.name} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "4 / 3" }} />
                  )}
                </div>
                <h2 className="h3" style={{ marginTop: 22 }}>{a.name}</h2>
                <p className="eyebrow eyebrow--wider" style={{ marginTop: 8 }}>
                  {a.photo_count} {a.photo_count === 1 ? "photograph" : "photographs"}{a.subtitle ? ` · ${a.subtitle}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
