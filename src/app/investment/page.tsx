import type { Metadata } from "next";
import { Editable, EditableImage } from "@/components/Editable";
import { Footer } from "@/components/Footer";
import { Button, Divider } from "@/components/ui";

export const metadata: Metadata = { title: "Investment", description: "Session pricing — sessions from $175, weddings from $1,200, every edited full-resolution image included." };
const P = "investment";

const SESSIONS = [
  { key: "thirty", label: "30 minutes", price: "$175", text: "One location, one look. Made for young families, milestone minis and a quick set of headshots.", lifted: false },
  { key: "hour", label: "One hour · most booked", price: "$225", text: "Room for two locations or an outfit change. The right length for seniors, couples and families with school-age kids.", lifted: true },
  { key: "two", label: "Two hours", price: "$400", text: "Extended families, a full brand shoot for your shop, or a session that follows the light from afternoon into dusk.", lifted: false },
];
const INCLUDED = [
  ["files", "Every edited image, full resolution", "The best of every scene and pose. You get the whole edited gallery as high-resolution digital files."],
  ["release", "A print release", "Print them anywhere, at any size, as many times as you like. Business sessions include commercial use."],
  ["gallery", "An online gallery to share", "A private link for downloading and passing along to grandparents, delivered within three weeks."],
  ["help", "Help before we shoot", "Location ideas, what-to-wear notes, and an honest opinion on the timing if you ask for one."],
];
const STEPS = [
  ["one", "I", "Say hello", "Tell me who's coming and roughly when. I'll write back with open dates."],
  ["two", "II", "Hold the time", "A short agreement and a retainer put your slot on the calendar."],
  ["three", "III", "The session", "We walk, we talk, I photograph. Very little standing still and smiling."],
  ["four", "IV", "Your gallery", "Edited, full-resolution files in your inbox within three weeks."],
];
const FAQ = [
  ["travel", "How far will you travel?", "Anywhere inside about an hour of Tulsa at no extra charge — Broken Arrow, Jenks, Bixby, Owasso, Sand Springs, Claremore. Further than that, ask me and I'll quote the drive honestly."],
  ["count", "How many photos will we get?", "Every frame worth keeping, edited. A thirty-minute session usually lands somewhere around thirty to fifty images; a full wedding day runs into the hundreds. I don't hold any back."],
  ["time", "When is the best time of day?", "The last two hours before sunset, almost always. With small children, early morning is often the kinder choice — we'll pick the one that suits your family, not my portfolio."],
  ["rain", "What if it rains?", "Oklahoma weather gets one free reschedule, no questions and no fee. Overcast light is lovely, though — we only move for real storms."],
  ["business", "Can we use the images for our business?", "Yes — brand and social sessions come with a commercial release covering your website, your ads and your channels. Just tell me at booking what you're planning."],
];

export default function InvestmentPage() {
  return (
    <>
      <header className="wrap wrap--narrow center" style={{ paddingTop: 96, paddingBottom: 72 }}>
        <Editable k={`${P}.header.eyebrow`} as="span" className="aside" style={{ fontSize: "1.35rem" }}>investment</Editable>
        <Editable k={`${P}.header.title`} as="h1" className="h1" style={{ margin: "12px 0 24px" }}>What a session costs</Editable>
        <Editable k={`${P}.header.lede`} as="p" className="lede" multiline>Sessions are booked by the hour, and the price covers both the time together and every edited, full-resolution image that comes out of it. No print packages, no per-file upgrades.</Editable>
      </header>

      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div style={{ marginBottom: 48 }}><Divider label="Sessions" /></div>
        <div className="grid grid-3" style={{ gap: 28 }}>
          {SESSIONS.map((s) => (
            <article key={s.key} className={`card col ${s.lifted ? "card--lifted" : ""}`} style={{ padding: "44px 34px", gap: 18 }}>
              <Editable k={`${P}.sessions.${s.key}.label`} as="span" className="eyebrow eyebrow--accent">{s.label}</Editable>
              <Editable k={`${P}.sessions.${s.key}.price`} as="p" style={{ fontFamily: "var(--font-display)", fontSize: "3.4rem", lineHeight: 1 }}>{s.price}</Editable>
              <Editable k={`${P}.sessions.${s.key}.text`} as="p" className="small muted" multiline>{s.text}</Editable>
            </article>
          ))}
        </div>
      </section>

      <section className="section--104 section--alt">
        <div className="wrap">
          <div style={{ marginBottom: 48 }}><Divider label="Weddings" /></div>
          <div className="grid split" style={{ gridTemplateColumns: "0.9fr 1.1fr", gap: 64, alignItems: "center" }}>
            <EditableImage k={`${P}.weddings.image`} src="/photos/couple-canal.jpg" alt="A couple on their wedding day" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-card)" }} />
            <div className="col" style={{ gap: 20 }}>
              {[["full", "Full wedding day", "Getting ready through the last dance — the whole day, start to finish.", "$1,200"], ["plus", "Wedding day + engagement", "Everything above, plus a one-hour engagement session before the day.", "$1,400"]].map(([key, title, text, price]) => (
                <article key={key} className="card stack-mobile" style={{ padding: "36px 34px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 32 }}>
                  <div>
                    <Editable k={`${P}.weddings.${key}.title`} as="h3" className="h4" style={{ marginBottom: 8 }}>{title}</Editable>
                    <Editable k={`${P}.weddings.${key}.text`} as="p" className="small muted" style={{ maxWidth: "40ch" }} multiline>{text}</Editable>
                  </div>
                  <Editable k={`${P}.weddings.${key}.price`} as="p" style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", lineHeight: 1, color: "var(--color-accent)", whiteSpace: "nowrap" }}>{price}</Editable>
                </article>
              ))}
              <Editable k={`${P}.weddings.note`} as="p" className="aside aside--muted" style={{ marginTop: 6, fontSize: "1.15rem" }} multiline>Dates are held with a signed agreement and a retainer; the rest is due the week of the wedding.</Editable>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section--104 grid split" style={{ gridTemplateColumns: "0.9fr 1.1fr", gap: 80, alignItems: "start" }}>
        <div>
          <Editable k={`${P}.included.eyebrow`} as="span" className="aside">what's included</Editable>
          <Editable k={`${P}.included.title`} as="h2" className="h2" style={{ margin: "12px 0 20px" }}>Every session, every time</Editable>
          <Editable k={`${P}.included.text`} as="p" className="body muted" style={{ maxWidth: "40ch" }} multiline>The number on the price list is the number you pay. The images are yours when they're ready.</Editable>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {INCLUDED.map(([key, title, text], i) => (
            <li key={key} style={{ display: "flex", gap: 22, padding: "26px 0", borderBottom: i < INCLUDED.length - 1 ? "1px solid var(--color-border-soft)" : "none" }}>
              <span className="aside" style={{ fontSize: "1.1rem", minWidth: 28 }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <Editable k={`${P}.included.${key}.title`} as="h3" className="h4" style={{ marginBottom: 6 }}>{title}</Editable>
                <Editable k={`${P}.included.${key}.text`} as="p" className="small muted" multiline>{text}</Editable>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section--104 section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: 60 }}>
            <Editable k={`${P}.process.eyebrow`} as="span" className="aside">how it works</Editable>
            <Editable k={`${P}.process.title`} as="h2" className="h2" style={{ marginTop: 10 }}>Four steps, no surprises</Editable>
          </div>
          <div className="grid grid-4" style={{ gap: 32 }}>
            {STEPS.map(([key, numeral, title, text]) => (
              <div key={key} className="center">
                <p style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: "2.4rem", color: "var(--color-accent)", lineHeight: 1 }}>{numeral}</p>
                <Editable k={`${P}.process.${key}.title`} as="h3" className="h4" style={{ marginBottom: 10 }}>{title}</Editable>
                <Editable k={`${P}.process.${key}.text`} as="p" className="small muted" multiline>{text}</Editable>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap wrap--narrow section--104">
        <div className="center" style={{ marginBottom: 48 }}>
          <Editable k={`${P}.faq.eyebrow`} as="span" className="aside">good questions</Editable>
          <Editable k={`${P}.faq.title`} as="h2" className="h2" style={{ marginTop: 10 }}>Before you ask</Editable>
        </div>
        {FAQ.map(([key, q, a]) => (
          <details key={key} className="faq">
            <summary><Editable k={`${P}.faq.${key}.q`}>{q}</Editable><span className="faq__plus" aria-hidden>+</span></summary>
            <Editable k={`${P}.faq.${key}.a`} as="p" className="body muted" style={{ maxWidth: "58ch" }} multiline>{a}</Editable>
          </details>
        ))}
      </section>

      <section className="section--104 section--pine center" style={{ paddingLeft: 40, paddingRight: 40 }}>
        <Editable k={`${P}.cta.eyebrow`} as="span" className="aside" style={{ color: "inherit", opacity: 0.85 }}>dates go quickly in the fall</Editable>
        <Editable k={`${P}.cta.title`} as="h2" className="h2" style={{ margin: "12px auto 28px", maxWidth: "18ch" }}>Tell me what you have in mind</Editable>
        <Button href="/contact" variant="outline-ivory" size="lg"><Editable k={`${P}.cta.button`}>Inquire about your date</Editable></Button>
      </section>

      <Footer afterBand />
    </>
  );
}
