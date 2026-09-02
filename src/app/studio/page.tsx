import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { currentAdmin } from "@/lib/auth";
import { Studio } from "./Studio";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const admin = await currentAdmin().catch(() => null);
  if (!admin) {
    // Nothing about galleries — not a name, not a photograph, not a word — reaches a signed-out visitor.
    return (
      <>
        <section className="wrap wrap--narrow" style={{ paddingTop: 110, paddingBottom: 140 }}>
          <p className="aside aside--muted aside--lede" style={{ marginBottom: 18 }}>for Emma only</p>
          <h1 className="h1 balance" style={{ fontSize: "3.4rem" }}>The studio is behind a word</h1>
          <p className="body" style={{ marginTop: 26 }}>Sign in with the small <strong>Admin</strong> control at the very bottom of any page, and this becomes the place where galleries are made — your own collections, and a private gallery for each client with its own word and link.</p>
          <p className="eyebrow eyebrow--wide" style={{ marginTop: 18 }}>Nothing here is public. No client name, no photograph, no word.</p>
        </section>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Studio />
      <footer className="footer" style={{ padding: "60px 40px 34px", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/emma-jane-logo.png" alt="Emma Jane Photography" className="footer__logo" style={{ height: 64 }} />
        <span className="footer__fine">The studio · only you can see this page</span>
      </footer>
    </>
  );
}
