import type { Metadata } from "next";
import { Editable, EditableImage } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { Button, Divider, Quote } from "@/components/ui";

export const metadata: Metadata = { title: "Portfolio", description: "Lifestyle sessions from around Tulsa — golden hour, back porches, gravel roads, downtown windows." };
const P = "portfolio";

export default function PortfolioPage() {
  return (
    <>
      <header className="wrap wrap--narrow center" style={{ paddingTop: 96, paddingBottom: 64 }}>
        <Editable k={`${P}.header.eyebrow`} as="span" className="aside" style={{ fontSize: "1.35rem" }}>portfolio</Editable>
        <Editable k={`${P}.header.title`} as="h1" className="h1" style={{ margin: "12px 0 24px" }}>The work</Editable>
        <Editable k={`${P}.header.lede`} as="p" className="lede" style={{ marginBottom: 18 }} multiline>Sessions from around Tulsa and wherever the drive takes us. Golden hour, back porches, gravel roads, downtown windows.</Editable>
        <Editable k={`${P}.header.note`} as="p" className="aside aside--muted" style={{ fontSize: "1.05rem" }}>Placeholder imagery — Emma's own photographs will live here.</Editable>
      </header>

      <section className="wrap wrap--wide" style={{ paddingBottom: 96 }}>
        <div className="grid mosaic" style={{ gridTemplateColumns: "repeat(6, 1fr)", gridAutoRows: 200, gap: 10 }}>
          {[
            ["senior-golden", "Senior session at golden hour", "span 3", "span 3"],
            ["family-beach", "Family session at sunset", "span 2", "span 2"],
            ["portrait-hat", "Portrait in the last of the light", "span 1", "span 2"],
            ["city-bw", "Downtown in winter light", "span 2", "span 2"],
            ["senior-bridge", "Senior portrait on the bridge", "span 1", "span 3"],
            ["couple-canal", "A couple at the end of the day", "span 3", "span 2"],
            ["street-alley", "A quiet street of storefronts", "span 2", "span 2"],
          ].map(([name, alt, col, row], i) => (
            <EditableImage key={name} k={`${P}.wall.${i + 1}`} src={`/photos/${name}.jpg`} alt={alt} style={{ gridColumn: col, gridRow: row, width: "100%", height: "100%", objectFit: "cover" }} />
          ))}
        </div>
      </section>

      <section className="section--104 section--alt">
        <div className="wrap">
          <div style={{ marginBottom: 48 }}><Divider label="For Local Business" /></div>
          <div className="grid grid-2" style={{ gap: 56, alignItems: "center" }}>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <EditableImage k={`${P}.business.image1`} src="/photos/street-alley.jpg" alt="Storefront morning" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
              <EditableImage k={`${P}.business.image2`} src="/photos/city-bw.jpg" alt="Downtown detail" className="m-0-top" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", marginTop: 40 }} />
            </div>
            <div>
              <Editable k={`${P}.business.title`} as="h2" className="h2" style={{ marginBottom: 22 }}>Brand &amp; social photography</Editable>
              <Editable k={`${P}.business.lede`} as="p" className="lede" style={{ marginBottom: 20, maxWidth: "46ch" }} multiline>Coffee shops, salons, makers, studios — a session built around your space and the things you sell, shot so it works on a website header and an Instagram grid alike.</Editable>
              <Editable k={`${P}.business.text`} as="p" className="body muted" style={{ marginBottom: 32, maxWidth: "46ch" }} multiline>Booked in the same timed blocks as any other session, with the full set of edited, full-resolution files delivered for commercial use.</Editable>
              <Button href="/contact" variant="secondary"><Editable k={`${P}.business.cta`}>Talk about your shop</Editable></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section row" style={{ justifyContent: "center" }}>
        <Quote attribution={<Editable k={`${P}.quote.by`}>Sample testimonial · senior session</Editable>}>
          <Editable k={`${P}.quote.text`} multiline>She took my daughter down a gravel road for an hour and brought back the version of her I see at home.</Editable>
        </Quote>
      </section>

      <section className="section--104 section--pine center" style={{ paddingLeft: 40, paddingRight: 40 }}>
        <Editable k={`${P}.cta.eyebrow`} as="span" className="aside" style={{ color: "inherit", opacity: 0.85 }}>when you're ready</Editable>
        <Editable k={`${P}.cta.title`} as="h2" className="h2" style={{ margin: "12px auto 28px", maxWidth: "18ch" }}>Let's find an hour of good light</Editable>
        <Button href="/contact" variant="outline-ivory" size="lg"><Editable k={`${P}.cta.button`}>Inquire about your date</Editable></Button>
      </section>

      <Footer afterBand />
    </>
  );
}
