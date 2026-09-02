import Link from "next/link";
import { Editable } from "./Editable";

export function Footer({ afterBand = false }: { afterBand?: boolean }) {
  return (
    <footer className={`footer ${afterBand ? "footer--after-band" : ""}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/emma-jane-logo.png" alt="Emma Jane Photography" className="footer__logo" />
      <Editable k="shared.footer.tagline" as="p" className="footer__tag">collect beautiful moments</Editable>
      <div className="footer__links">
        <Link href="/portfolio">Portfolio</Link>
        <Link href="/investment">Investment</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/galleries">Galleries</Link>
        <Link href="/client-gallery">Client galleries</Link>
        <a href="mailto:hello@emmajanephoto.com">hello@emmajanephoto.com</a>
      </div>
      <Editable k="shared.footer.fine" as="span" className="footer__fine">Tulsa, Oklahoma &amp; surrounding areas · © 2026 Emma Jane Photography</Editable>
    </footer>
  );
}
