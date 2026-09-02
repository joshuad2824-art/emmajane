import type { Metadata } from "next";
import { Editable, EditableImage } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { ArchFrame, Button, Divider, NoteCard } from "@/components/ui";

export const metadata: Metadata = { title: "About", description: "Emma Jane — lifestyle photographer in Tulsa, Oklahoma." };
const P = "about";

export default function AboutPage() {
  return (
    <>
      <section className="wrap grid split" style={{ paddingTop: 96, paddingBottom: 104, gridTemplateColumns: "0.9fr 1.1fr", gap: 88, alignItems: "center" }}>
        <div className="row" style={{ justifyContent: "center" }}>
          <ArchFrame aspectRatio="3/4" matted>
            <EditableImage k={`${P}.portrait`} src="/photos/emma-portrait.jpg" alt="Emma Jane" className="arch__img" />
          </ArchFrame>
        </div>
        <div>
          <Editable k={`${P}.hero.eyebrow`} as="span" className="aside" style={{ fontSize: "1.35rem" }}>about</Editable>
          <Editable k={`${P}.hero.title`} as="h1" className="h1" style={{ margin: "12px 0 28px" }}>I'm Emma Jane</Editable>
          <Editable k={`${P}.hero.p1`} as="p" className="lede" style={{ marginBottom: 20, maxWidth: "52ch" }} multiline>I've lived in and around Tulsa most of my life, and I still think the best thing about it is the light at the end of a summer day — the way it comes sideways across a field off Route 66 and makes everybody look like they're remembering something.</Editable>
          <Editable k={`${P}.hero.p2`} as="p" className="body muted" style={{ marginBottom: 20, maxWidth: "52ch" }} multiline>Lifestyle photography is just a way of saying I'd rather photograph what's happening than arrange it. I'll give you something to do instead of somewhere to look. Walk that way, tell him what you were laughing about earlier, pick her up if she asks. The pictures come out of that.</Editable>
          <Editable k={`${P}.hero.p3`} as="p" className="body muted" style={{ marginBottom: 36, maxWidth: "52ch" }} multiline>Families, seniors, weddings, and the small shops that keep this town interesting — those are my people.</Editable>
          <Button href="/contact" variant="primary"><Editable k={`${P}.hero.cta`}>Say hello</Editable></Button>
        </div>
      </section>

      <section className="section--96 section--alt">
        <div className="wrap grid grid-3" style={{ gap: 48, alignItems: "center" }}>
          <EditableImage k={`${P}.strip.image1`} src="/photos/senior-golden.jpg" alt="A session at the end of the day" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)" }} />
          <div className="col" style={{ alignItems: "center", gap: 40, textAlign: "center" }}>
            <NoteCard pin="tack" rotate={2} width={240}><Editable k={`${P}.strip.note`}>real days, softly kept</Editable></NoteCard>
            <Editable k={`${P}.strip.line`} as="p" className="aside" style={{ fontSize: "1.35rem", lineHeight: "var(--leading-snug)", maxWidth: "26ch" }} multiline>The photograph you keep is almost never the one you posed for.</Editable>
          </div>
          <EditableImage k={`${P}.strip.image2`} src="/photos/family-beach.jpg" alt="A family at the end of the day" className="m-0-top" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)", marginTop: 56 }} />
        </div>
      </section>

      <section className="wrap section--104">
        <div style={{ marginBottom: 56 }}><Divider label="A Few True Things" /></div>
        <div className="grid grid-3" style={{ gap: 56 }}>
          {[
            ["kids", "Kids can be kids", "Nobody has to sit still or say cheese. If a session turns into a game of chase, that's usually when the good ones happen."],
            ["posed", "You will not be posed to death", "I'll direct enough that you never feel stranded, and then get out of the way. Most people relax about ten minutes in."],
            ["keep", "You keep everything", "Full-resolution edited files and a print release with every session. I'd rather your photos live on a wall than in my portfolio."],
          ].map(([key, title, text]) => (
            <div key={key}>
              <Editable k={`${P}.true.${key}.title`} as="h3" className="h4" style={{ marginBottom: 12 }}>{title}</Editable>
              <Editable k={`${P}.true.${key}.text`} as="p" className="body muted" multiline>{text}</Editable>
            </div>
          ))}
        </div>
      </section>

      <section className="section--104 section--pine center" style={{ paddingLeft: 40, paddingRight: 40 }}>
        <Editable k={`${P}.cta.eyebrow`} as="span" className="aside" style={{ color: "inherit", opacity: 0.85 }}>say hello</Editable>
        <Editable k={`${P}.cta.title`} as="h2" className="h2" style={{ margin: "12px auto 28px", maxWidth: "20ch" }}>I'd love to hear what you're planning</Editable>
        <Button href="/contact" variant="outline-ivory" size="lg"><Editable k={`${P}.cta.button`}>Start a conversation</Editable></Button>
      </section>

      <Footer afterBand />
    </>
  );
}
