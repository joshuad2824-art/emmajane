import type { Metadata } from "next";
import { Editable, EditableImage } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { ArchFrame, Button, Divider, PhotoFrame, Quote } from "@/components/ui";

export const metadata: Metadata = { title: "Emma Jane Photography · Tulsa lifestyle photographer" };

const P = "home";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <header className="hero" style={{ position: "relative", height: "82vh", minHeight: 600, overflow: "hidden" }}>
        <EditableImage k={`${P}.hero.image`} src="/photos/senior-golden.jpg" alt="Golden hour portrait session outside Tulsa" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 34%" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(49,70,60,0.10) 0%, rgba(49,70,60,0.06) 45%, rgba(49,70,60,0.52) 100%)" }} />
        <div className="rise" style={{ position: "absolute", left: 0, right: 0, bottom: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center", padding: "0 40px", color: "#fff" }}>
          <Editable k={`${P}.hero.eyebrow`} as="span" style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", fontSize: "1.45rem", textShadow: "0 1px 18px rgba(32,48,42,0.45)" }}>real days, real light, softly kept</Editable>
          <Editable k={`${P}.hero.title`} as="h1" className="hero__title balance" style={{ fontSize: "4.75rem", lineHeight: "var(--leading-tight)", letterSpacing: "0.01em", maxWidth: "15ch", textShadow: "0 2px 28px rgba(32,48,42,0.4)" }}>Photographs that feel like the day itself</Editable>
          <div className="wrap-row" style={{ gap: 16, marginTop: 6, justifyContent: "center" }}>
            <Button href="/contact" variant="primary" size="lg"><Editable k={`${P}.hero.cta1`}>Inquire about your date</Editable></Button>
            <Button href="/portfolio" variant="outline-light" size="lg"><Editable k={`${P}.hero.cta2`}>See the work</Editable></Button>
          </div>
        </div>
      </header>

      {/* What I photograph */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: 64 }}>
            <Editable k={`${P}.kinds.eyebrow`} as="span" className="aside">what I photograph</Editable>
            <Editable k={`${P}.kinds.title`} as="h2" className="h2" style={{ marginTop: 10 }}>Three kinds of ordinary magic</Editable>
          </div>
          <div className="grid grid-3" style={{ gap: 56 }}>
            {[
              { key: "families", img: "/photos/family-beach.jpg", alt: "Family session at golden hour", title: "Families", text: "Kids who won't sit still, and that's the point. Bring the dog, bring the mess." },
              { key: "seniors", img: "/photos/senior-bridge.jpg", alt: "Senior portrait session", title: "Seniors", text: "A whole year of becoming someone, in one unhurried evening. Outfit changes welcome." },
              { key: "weddings", img: "/photos/couple-canal.jpg", alt: "Couple on their wedding day", title: "Weddings", text: "Full-day coverage, quietly. I'll be the one you forget is there until you need me." },
            ].map((c) => (
              <article key={c.key} className="col" style={{ alignItems: "center", textAlign: "center", gap: 20 }}>
                <ArchFrame aspectRatio="3/4">
                  <EditableImage k={`${P}.kinds.${c.key}.image`} src={c.img} alt={c.alt} className="arch__img" />
                </ArchFrame>
                <div>
                  <Editable k={`${P}.kinds.${c.key}.title`} as="h3" className="h3" style={{ marginBottom: 10 }}>{c.title}</Editable>
                  <Editable k={`${P}.kinds.${c.key}.text`} as="p" className="small muted" style={{ maxWidth: "34ch", margin: "0 auto" }}>{c.text}</Editable>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Small business */}
      <section className="wrap section grid split" style={{ gridTemplateColumns: "1.05fr 0.95fr", gap: 72, alignItems: "center" }}>
        <div>
          <Editable k={`${P}.business.eyebrow`} as="span" className="aside">for local business</Editable>
          <Editable k={`${P}.business.title`} as="h2" className="h2" style={{ margin: "12px 0 22px" }}>Photographs your shop can actually use</Editable>
          <Editable k={`${P}.business.lede`} as="p" className="lede" style={{ marginBottom: 20, maxWidth: "50ch" }} multiline>A morning in your space — the hands, the product, the person behind the counter — shot for the way you post and the way your website is built.</Editable>
          <Editable k={`${P}.business.text`} as="p" className="body muted" style={{ marginBottom: 32, maxWidth: "50ch" }} multiline>You leave with a folder of full-resolution edited images and enough vertical crops to last the season.</Editable>
          <Button href="/investment" variant="secondary"><Editable k={`${P}.business.cta`}>See session rates</Editable></Button>
        </div>
        <EditableImage k={`${P}.business.image`} src="/photos/street-alley.jpg" alt="Storefronts on a quiet morning" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)" }} />
      </section>

      {/* Recent work */}
      <section className="wrap" style={{ paddingBottom: 112 }}>
        <div style={{ marginBottom: 44 }}><Divider label="Recent Work" /></div>
        <div className="grid mosaic" style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: 190, gap: 10 }}>
          {[
            ["senior-golden", "span 2", "span 2"], ["family-beach", "span 1", "span 2"], ["portrait-hat", "span 1", "span 1"], ["city-bw", "span 1", "span 1"],
            ["couple-canal", "span 2", "span 2"], ["senior-bridge", "span 1", "span 2"], ["street-alley", "span 1", "span 2"],
          ].map(([name, col, row], i) => (
            <EditableImage key={name} k={`${P}.recent.${i + 1}`} src={`/photos/${name}.jpg`} alt="" style={{ gridColumn: col, gridRow: row, width: "100%", height: "100%", objectFit: "cover" }} />
          ))}
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 44 }}>
          <Button href="/portfolio" variant="secondary"><Editable k={`${P}.recent.cta`}>View the full portfolio</Editable></Button>
        </div>
      </section>

      {/* Investment teaser */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: 56 }}>
            <Editable k={`${P}.investment.eyebrow`} as="span" className="aside">investment</Editable>
            <Editable k={`${P}.investment.title`} as="h2" className="h2" style={{ margin: "10px 0 16px" }}>Simple sessions</Editable>
            <Editable k={`${P}.investment.text`} as="p" className="body muted" style={{ margin: "0 auto", maxWidth: "60ch" }} multiline>Every session includes the full set of edited, full-resolution digital images — yours to print, share and keep.</Editable>
          </div>
          <div className="grid grid-3" style={{ gap: 24, maxWidth: 940, margin: "0 auto" }}>
            {[["30 minutes", "$175", "thirty"], ["One hour", "$225", "hour"], ["Two hours", "$400", "two"]].map(([label, price, key]) => (
              <div key={key} className="card center" style={{ padding: "40px 28px" }}>
                <Editable k={`${P}.investment.${key}.label`} as="span" className="eyebrow">{label}</Editable>
                <Editable k={`${P}.investment.${key}.price`} as="p" style={{ margin: "16px 0 0", fontFamily: "var(--font-display)", fontSize: "3rem", lineHeight: 1, color: "var(--color-accent)" }}>{price}</Editable>
              </div>
            ))}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 40 }}>
            <Button href="/investment" variant="primary"><Editable k={`${P}.investment.cta`}>Weddings &amp; full pricing</Editable></Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="wrap grid split" style={{ paddingTop: 120, paddingBottom: 120, gridTemplateColumns: "260px 1fr", gap: 80, alignItems: "center" }}>
        <div className="row" style={{ justifyContent: "center" }}>
          <PhotoFrame rotate={-3} caption={<Editable k={`${P}.testimonials.caption`}>the Halversons, October</Editable>}>
            <EditableImage k={`${P}.testimonials.image`} src="/photos/family-beach.jpg" alt="A family at the end of the day" />
          </PhotoFrame>
        </div>
        <div className="col" style={{ gap: 48 }}>
          <Quote attribution={<Editable k={`${P}.testimonials.one.by`}>Sample testimonial · family session</Editable>}>
            <Editable k={`${P}.testimonials.one.text`} multiline>We booked thirty minutes expecting a chore and got the only photo of all five of us that anyone actually likes.</Editable>
          </Quote>
          <Quote attribution={<Editable k={`${P}.testimonials.two.by`}>Sample testimonial · wedding</Editable>}>
            <Editable k={`${P}.testimonials.two.text`} multiline>She was somehow everywhere and nowhere all day. We got the gallery back and cried in the kitchen.</Editable>
          </Quote>
        </div>
      </section>

      {/* Instagram */}
      <section>
        <div className="wrap center" style={{ paddingBottom: 32 }}>
          <Editable k={`${P}.instagram.eyebrow`} as="span" className="aside" style={{ fontSize: "1.25rem" }}>lately, on Instagram</Editable>
          <Editable k={`${P}.instagram.handle`} as="p" className="eyebrow" style={{ marginTop: 8 }}>@emmajanephoto</Editable>
        </div>
        <div className="grid mosaic mosaic--six" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {["senior-bridge", "couple-canal", "portrait-hat", "family-beach", "street-alley", "senior-golden"].map((name, i) => (
            <EditableImage key={name} k={`${P}.instagram.${i + 1}`} src={`/photos/${name}.jpg`} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
