"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Lightbox } from "@/components/Lightbox";
import { Button, Input } from "@/components/ui";
import { longDate } from "@/lib/dates";
import type { PublicGallery } from "@/lib/galleries";

export type GalleryPayload = { gallery: PublicGallery; photos: { id: string; width: number; height: number }[]; favourites: string[] };

const WRONG = "That one does not open anything — try the word from your email.";
const EMPTY = "I will need the word first.";

export function ClientGalleryView({ initial, autoWord }: { initial: GalleryPayload | null; autoWord: string }) {
  const router = useRouter();
  const [data, setData] = useState<GalleryPayload | null>(initial);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [marked, setMarked] = useState<Set<string>>(new Set(initial?.favourites ?? []));
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [toast, setToast] = useState("");
  const [box, setBox] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triedAuto = useRef(false);

  const say = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3600);
  }, []);

  const unlock = useCallback(async (word: string, quiet = false) => {
    if (!word.trim()) { if (!quiet) setNote(EMPTY); return; }
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/client-galleries/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word }) });
      if (res.ok) {
        const payload = (await res.json()) as GalleryPayload;
        setData(payload);
        setMarked(new Set(payload.favourites));
        setOnlyMarked(false);
        setCode("");
        if (typeof window !== "undefined" && window.location.search) window.history.replaceState(null, "", "/client-gallery");
      } else if (res.status === 429) {
        setNote("Too many tries for now. Give it a few minutes and try again.");
      } else if (!quiet) {
        setNote(WRONG);
      }
    } catch {
      if (!quiet) setNote("The site could not be reached just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (initial || !autoWord || triedAuto.current) return;
    triedAuto.current = true;
    unlock(autoWord, true);
  }, [autoWord, initial, unlock]);

  const closeBox = useCallback(() => setBox(null), []);

  async function close() {
    await fetch("/api/client-galleries/current", { method: "DELETE" });
    setData(null);
    setMarked(new Set());
    router.refresh();
  }

  async function toggleMark(photoId: string) {
    if (!data) return;
    const next = new Set(marked);
    const willMark = !next.has(photoId);
    if (willMark) next.add(photoId); else next.delete(photoId);
    setMarked(next);
    const res = await fetch(`/api/client-galleries/${data.gallery.slug}/favourites`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo_id: photoId, marked: willMark }) });
    if (!res.ok) { setMarked(marked); say("That did not save — try once more."); }
  }

  function download(path: string, what: string) {
    say(`Getting ${what} ready…`);
    window.location.assign(path);
  }

  async function share() {
    if (!data) return;
    const url = `${window.location.origin}${data.gallery.share_path}`;
    try { await navigator.clipboard.writeText(url); say("Link copied. Anyone with it can open this gallery."); }
    catch { window.prompt("Copy this link:", url); }
  }

  if (!data) {
    const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); unlock(code); } };
    return (
      <section className="wrap wrap--48" style={{ paddingTop: 96, paddingBottom: 110 }}>
        <div className="grid split" style={{ gridTemplateColumns: "1.15fr 0.85fr", gap: 72, alignItems: "start" }}>
          <div>
            <p className="aside aside--muted aside--lede" style={{ marginBottom: 18 }}>your session, kept safe</p>
            <h1 className="h1 balance" style={{ maxWidth: "20ch" }}>Your gallery is waiting</h1>
            <p className="body" style={{ marginTop: 28, maxWidth: "50ch" }}>I sent you a word along with your link. It opens your gallery and nothing else — no account to make, no password to remember. Everything in it is yours to download, full size, as many times as you like.</p>
            <p className="body muted" style={{ marginTop: 20, maxWidth: "50ch" }}>If the word has gone missing, write to me and I will send it again. Galleries stay up for ninety days; tell me if you need longer and I will keep it open.</p>
            <p className="eyebrow eyebrow--wider" style={{ marginTop: 30 }}>hello@emmajanephoto.com</p>
          </div>
          <div className="card" style={{ borderColor: "var(--color-border)", padding: "40px 34px" }}>
            <h2 className="h4">The word I sent you</h2>
            <div style={{ marginTop: 20 }}>
              <Input placeholder="e.g. goldenfield" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={onKey} autoComplete="off" autoCapitalize="none" aria-label="The word I sent you" />
            </div>
            <p className="aside" role="alert" style={{ marginTop: 12, minHeight: 24, fontSize: "var(--text-small)", color: "var(--color-destructive)" }}>{note}</p>
            <div style={{ marginTop: 14 }}>
              <Button variant="primary" size="lg" block onClick={() => unlock(code)} disabled={busy}>{busy ? "Opening…" : "Open my gallery"}</Button>
            </div>
            <p className="eyebrow eyebrow--wide" style={{ marginTop: 20 }}>Capital letters do not matter.</p>
          </div>
        </div>
      </section>
    );
  }

  const { gallery, photos } = data;
  const shown = onlyMarked ? photos.filter((p) => marked.has(p.id)) : photos;
  const n = photos.length, m = marked.size;
  const base = `/api/client-galleries/${gallery.slug}`;

  return (
    <div className="rise">
      <header className="wrap wrap--48" style={{ paddingTop: 76, paddingBottom: 34 }}>
        {gallery.shot_on ? <p className="aside aside--muted aside--lede" style={{ marginBottom: 16 }}>photographed {longDate(gallery.shot_on)}</p> : null}
        <h1 className="h1">{gallery.client_name}</h1>
        <div className="wrap-row" style={{ marginTop: 22, gap: "12px 26px" }}>
          <span className="eyebrow eyebrow--wider">{n} {n === 1 ? "photograph" : "photographs"}</span>
          <span className="eyebrow eyebrow--wider">here until {longDate(gallery.expires_on)}</span>
          <button type="button" className="text-btn" onClick={close}>Close the gallery</button>
        </div>
        <div className="wrap-row" style={{ marginTop: 30, gap: 14 }}>
          <Button variant="primary" size="lg" onClick={() => download(`${base}/download?scope=all`, "every photograph")} disabled={n === 0}>Download every photograph</Button>
          <Button variant="secondary" size="lg" onClick={() => download(`${base}/download?scope=marked`, "the marked photographs")} disabled={m === 0}>Download the {m} marked</Button>
          <button type="button" className="btn btn--outline" onClick={() => setOnlyMarked((v) => !v)}>
            {onlyMarked ? `Show all ${n}` : m ? `Show the ${m} marked` : "Show only marked"}
          </button>
          <button type="button" className="text-btn" onClick={share}>Copy the link for family</button>
        </div>
        <p className="status-line" style={{ marginTop: 16 }} aria-live="polite">{toast}</p>
      </header>

      <section className="wrap wrap--48" style={{ paddingBottom: 60 }}>
        <div className="grid grid-3" style={{ gap: "34px 26px" }}>
          {shown.map((p, i) => {
            const isMarked = marked.has(p.id);
            return (
              <figure key={p.id} style={{ margin: 0 }} className="rise">
                <div style={{ background: "var(--color-surface)", padding: 10, boxShadow: "var(--shadow-frame)", cursor: "zoom-in" }} onClick={() => setBox(`/api/photos/${p.id}/web`)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${p.id}/thumb`} alt="" loading={i > 5 ? "lazy" : undefined} style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover" }} />
                </div>
                <figcaption className="wrap-row" style={{ marginTop: 12, gap: 10, justifyContent: "space-between" }}>
                  <button type="button" onClick={() => toggleMark(p.id)} aria-pressed={isMarked} className="btn btn--sm" style={{ minHeight: 40, padding: "0 14px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-eyebrow)", border: `1px solid ${isMarked ? "var(--color-accent)" : "var(--color-border)"}`, background: isMarked ? "var(--color-accent)" : "transparent", color: isMarked ? "var(--color-text-inverse)" : "var(--color-text)" }}>
                    {isMarked ? "Marked for print" : "Mark this one"}
                  </button>
                  <button type="button" className="text-btn" onClick={() => download(`${base}/download/${p.id}`, "that photograph")}>Download</button>
                </figcaption>
              </figure>
            );
          })}
        </div>
        {onlyMarked && shown.length === 0 ? <p className="aside aside--muted aside--lede">Nothing marked yet. Plenty of time.</p> : null}
        {!onlyMarked && n === 0 ? <p className="aside aside--muted aside--lede">The photographs are still being made ready. Check back soon.</p> : null}
      </section>

      <section className="section--alt" style={{ padding: "68px 48px 76px" }}>
        <div className="center" style={{ maxWidth: 720, margin: "0 auto" }}>
          {gallery.note ? <p className="hand" style={{ fontSize: "1.5rem", lineHeight: 1.7 }}>{gallery.note}</p> : null}
          <p className="hand" style={{ marginTop: 26, fontSize: "1.8rem", color: "var(--color-accent)" }}>Emma</p>
        </div>
      </section>

      <Lightbox src={box} onClose={closeBox} />
    </div>
  );
}
