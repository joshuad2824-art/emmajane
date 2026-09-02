import Link from "next/link";
import type { CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline-light" | "outline-ivory" | "outline";
type Size = "sm" | "md" | "lg";

export function Button({
  variant = "primary", size = "md", href, block, className = "", children, ...rest
}: { variant?: Variant; size?: Size; href?: string; block?: boolean; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `btn btn--${variant} btn--${size} ${block ? "btn--block" : ""} ${className}`.trim();
  if (href) {
    return <Link href={href} className={cls}>{children}</Link>;
  }
  return <button type="button" className={cls} {...rest}>{children}</button>;
}

export function Input({ label, error, className = "", ...rest }: { label?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className={`field__input ${error ? "field__input--error" : ""}`.trim()} {...rest} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className = "", ...rest }: { label?: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <textarea className={`field__input ${error ? "field__input--error" : ""}`.trim()} rows={5} {...rest} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function Select({ label, options, className = "", ...rest }: { label?: string; options: string[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <select className="field__input" {...rest}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function Checkbox({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="check" style={{ position: "relative" }}>
      <input type="checkbox" {...rest} />
      <span className="check__box" aria-hidden>
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="var(--color-text-inverse)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {label}
    </label>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="divider" role="separator">
      <div className="divider__line" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: "var(--color-accent)", flexShrink: 0 }} aria-hidden>
        <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
      </svg>
      {label ? <span className="divider__label">{label}</span> : null}
      <div className="divider__line" />
    </div>
  );
}

export function Quote({ attribution, children, style }: { attribution?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <blockquote className="quote" style={style}>
      <p>&ldquo;{children}&rdquo;</p>
      {attribution ? <cite>{attribution}</cite> : null}
    </blockquote>
  );
}

export function ArchFrame({ children, aspectRatio = "3/4", matted = false, style }: { children: ReactNode; aspectRatio?: string; matted?: boolean; style?: CSSProperties }) {
  return (
    <figure className="arch" style={{ width: "100%", ...style }}>
      <div className={`arch__mat ${matted ? "arch__mat--matted" : ""}`.trim()} style={{ aspectRatio }}>
        {children}
      </div>
    </figure>
  );
}

export function PhotoFrame({ children, caption, rotate = -2 }: { children: ReactNode; caption?: ReactNode; rotate?: number }) {
  return (
    <figure className="polaroid" style={{ transform: `rotate(${rotate}deg)` }}>
      {children}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function NoteCard({ children, pin = "tape", rotate = -1.5, width = 240 }: { children: ReactNode; pin?: "tape" | "tack"; rotate?: number; width?: number }) {
  return (
    <div className="note" style={{ width, transform: `rotate(${rotate}deg)` }}>
      <div className="note__paper">{children}</div>
      {pin === "tape" ? <span className="note__tape" aria-hidden /> : <span className="note__tack" aria-hidden />}
    </div>
  );
}

export function Badge({ on, children }: { on: boolean; children: ReactNode }) {
  return <span className={`badge ${on ? "badge--on" : "badge--off"}`}>{children}</span>;
}
