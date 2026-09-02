import type { Metadata } from "next";
import Link from "next/link";
import { Editable, EditableImage } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { NoteCard } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Tell me who's coming, roughly when, and where you had in mind." };
const P = "contact";

export default function ContactPage() {
  return (
    <>
      <section className="wrap grid split" style={{ paddingTop: 88, paddingBottom: 104, gridTemplateColumns: "1.15fr 0.85fr", gap: 80, alignItems: "start" }}>
        <div>
          <Editable k={`${P}.eyebrow`} as="span" className="aside" style={{ fontSize: "1.35rem" }}>say hello</Editable>
          <Editable k={`${P}.title`} as="h1" className="h1" style={{ margin: "12px 0 24px" }}>Let's tell your story</Editable>
          <Editable k={`${P}.lede`} as="p" className="lede" style={{ marginBottom: 44, maxWidth: "48ch" }} multiline>Tell me who's coming, roughly when, and where you had in mind. I answer every note within a couple of days — usually with a few date options and an honest suggestion about timing.</Editable>
          <ContactForm />
        </div>

        <aside className="col" style={{ gap: 32 }}>
          <EditableImage k={`${P}.image`} src="/photos/senior-bridge.jpg" alt="A session in the last of the light" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)" }} />
          <div className="col" style={{ gap: 22 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Email</p>
              <a href="mailto:hello@emmajanephoto.com" style={{ fontSize: "var(--text-body)", textDecoration: "none" }}>hello@emmajanephoto.com</a>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Instagram</p>
              <Editable k={`${P}.instagram`} as="p" style={{ fontSize: "var(--text-body)" }}>@emmajanephoto</Editable>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Where</p>
              <Editable k={`${P}.where`} as="p" style={{ fontSize: "var(--text-body)", lineHeight: "var(--leading-normal)" }}>Tulsa, Oklahoma — and an hour in every direction.</Editable>
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>Sessions</p>
              <p style={{ fontSize: "var(--text-body)", lineHeight: "var(--leading-normal)" }}><Editable k={`${P}.sessions`}>From $175 for thirty minutes.</Editable> <Link href="/investment">See the full list</Link>.</p>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "center", paddingTop: 8 }}>
            <NoteCard pin="tape" rotate={-2} width={230}><Editable k={`${P}.note`}>no such thing as too many questions</Editable></NoteCard>
          </div>
        </aside>
      </section>
      <Footer />
    </>
  );
}
