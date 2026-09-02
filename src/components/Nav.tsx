"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/galleries", label: "Galleries" },
  { href: "/investment", label: "Investment" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const path = usePathname() || "/";
  const isCurrent = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <nav className="nav" aria-label="Primary">
      <Link href="/" className="nav__logo" aria-label="Emma Jane Photography — home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/emma-jane-logo.png" alt="Emma Jane Photography" />
      </Link>
      <div className="nav__links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="nav__link" aria-current={isCurrent(l.href) ? "page" : undefined}>{l.label}</Link>
        ))}
      </div>
    </nav>
  );
}
