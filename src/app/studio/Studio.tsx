"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Badge, Button, Input, Textarea } from "@/components/ui";
import { longDate, plusDaysIso, shortDate, todayIso } from "@/lib/dates";

type Tab = "mine" | "clients" | "notes";
type Album = { id: string; slug: string; name: string; subtitle: string; live: boolean; position: number; cover_photo_id: string | null; photo_count: number };
type Gallery = { id: string; slug: string; client_name: string; access_word: string; link_token: string; shot_on: string | null; expires_on: string; note: string; position: number; first_opened_at: string | null; downloads: number; photo_count: number; marked_count: number };
type Inquiry = { id: string; name: string; email: string; phone: string; session_type: string; preferred_date: string | null; location: string; message: string; opt_in: boolean; created_at: string; read_at: string | null };
type FormPhoto = { id: string; cap: string; marked?: boolean };
type Form = {
  kind: "album" | "client"; id: string | null; name: string; sub: string; shot: string; until: string; note: string; live: boolean;
  cover: string | null; photos: FormPhoto[]; original: string[]; slug: string; token: string;
};

const thumb = (id: string) => `/api/photos/${id}/thumb`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
  return (await res.json()) as T;
}

export function Studio() {
  const [tab, setTab] = useState<Tab>("mine");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<{ name?: string; sub?: string }>({});
  const [busy, setBusy] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const say = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [a, g, n] = await Promise.all([api<Album[]>("/api/admin/albums"), api<Gallery[]>("/api/admin/client-galleries"), api<Inquiry[]>("/api/admin/inquiries")]);
      setAlbums(a); setGalleries(g); setInquiries(n);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, [say]);

  useEffect(() => { reload(); }, [reload]);

  /* ---------- list helpers ---------- */
  const today = todayIso();
  const openCount = galleries.filter((g) => g.expires_on >= today).length;
  const liveCount = albums.filter((a) => a.live).length;
  const unread = inquiries.filter((i) => !i.read_at).length;

  const countLine = useMemo(() => {
    if (tab === "mine") {
      if (!albums.length) return "no galleries yet";
      const drafts = albums.length - liveCount;
      return [`${liveCount} on the site`, drafts ? `${drafts} still a draft` : ""].filter(Boolean).join(" · ") + " — top of the list shows first";
    }
    if (tab === "clients") {
      if (!galleries.length) return "no galleries yet";
      return `${openCount} open · ${galleries.length - openCount} closed`;
    }
    if (!inquiries.length) return "no notes yet";
    return `${unread} unread · ${inquiries.length} in all`;
  }, [tab, albums, galleries, inquiries, liveCount, openCount, unread]);

  async function move(kind: "album" | "client", id: string, dir: -1 | 1) {
    const list = kind === "album" ? albums : galleries;
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const ids = list.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const path = kind === "album" ? "/api/admin/albums/order" : "/api/admin/client-galleries/order";
    if (kind === "album") setAlbums((prev) => ids.map((x) => prev.find((p) => p.id === x)!));
    else setGalleries((prev) => ids.map((x) => prev.find((p) => p.id === x)!));
    try { await api(path, { method: "PUT", body: JSON.stringify({ ids }) }); } catch (e) { say((e as Error).message); reload(); }
  }

  async function toggleLive(a: Album) {
    try {
      await api(`/api/admin/albums/${a.id}`, { method: "PATCH", body: JSON.stringify({ live: !a.live }) });
      say(a.live ? "Taken off the site." : "It is on the site.");
      reload();
    } catch (e) { say((e as Error).message); }
  }

  async function remove(kind: "album" | "client", id: string) {
    if (confirmId !== id) { setConfirmId(id); return; }
    setConfirmId(null);
    try {
      await api(kind === "album" ? `/api/admin/albums/${id}` : `/api/admin/client-galleries/${id}`, { method: "DELETE" });
      say(kind === "album" ? "Gallery taken down." : "Gallery taken down. The word no longer opens anything.");
      reload();
    } catch (e) { say((e as Error).message); }
  }

  async function copyLink(g: Gallery) {
    const url = `${origin}/g/${g.link_token}`;
    try { await navigator.clipboard.writeText(url); say("Link copied."); } catch { window.prompt("Copy this link:", url); }
  }

  /* ---------- editor ---------- */
  function startNew() {
    setErrors({});
    setConfirmId(null);
    if (tab === "mine") setForm({ kind: "album", id: null, name: "", sub: "", shot: "", until: "", note: "", live: false, cover: null, photos: [], original: [], slug: "", token: "" });
    else setForm({ kind: "client", id: null, name: "", sub: "", shot: todayIso(), until: plusDaysIso(90), note: "", live: true, cover: null, photos: [], original: [], slug: "", token: "" });
  }

  async function startEdit(kind: "album" | "client", id: string) {
    setErrors({});
    setConfirmId(null);
    try {
      if (kind === "album") {
        const d = await api<Album & { photos: { photo_id: string; caption: string }[] }>(`/api/admin/albums/${id}`);
        setForm({ kind, id, name: d.name, sub: d.subtitle, shot: "", until: "", note: "", live: d.live, cover: d.cover_photo_id, photos: d.photos.map((p) => ({ id: p.photo_id, cap: p.caption })), original: d.photos.map((p) => p.photo_id), slug: d.slug, token: "" });
      } else {
        const d = await api<Gallery & { photos: { photo_id: string }[]; favourites: string[] }>(`/api/admin/client-galleries/${id}`);
        const fav = new Set(d.favourites);
        setForm({ kind, id, name: d.client_name, sub: d.access_word, shot: d.shot_on ?? "", until: d.expires_on, note: d.note, live: true, cover: null, photos: d.photos.map((p) => ({ id: p.photo_id, cap: "", marked: fav.has(p.photo_id) })), original: d.photos.map((p) => p.photo_id), slug: d.slug, token: d.link_token });
      }
    } catch (e) { say((e as Error).message); }
  }

  const patch = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f));

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|tiff?)$/i.test(f.name));
    if (!list.length) return;
    setBusy((b) => b + list.length);
    let failed = 0;
    const queue = [...list];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift()!;
        try {
          const fd = new FormData();
          fd.append("file", f);
          const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "upload failed");
          const p = (await res.json()) as { id: string };
          setForm((cur) => {
            if (!cur) return cur;
            if (cur.photos.some((x) => x.id === p.id)) return cur;
            const photos = [...cur.photos, { id: p.id, cap: "" }];
            return { ...cur, photos, cover: cur.kind === "album" && !cur.cover ? p.id : cur.cover };
          });
        } catch {
          failed += 1;
        } finally {
          setBusy((b) => b - 1);
        }
      }
    };
    await Promise.all([worker(), worker()]);
    if (failed) say(failed === 1 ? "One photograph could not be added — the rest are in." : `${failed} photographs could not be added — the rest are in.`);
  }

  function onDrop(e: DragEvent) { e.preventDefault(); if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files); }

  function movePhoto(i: number, dir: -1 | 1) {
    setForm((f) => {
      if (!f) return f;
      const j = i + dir;
      if (j < 0 || j >= f.photos.length) return f;
      const photos = [...f.photos];
      [photos[i], photos[j]] = [photos[j], photos[i]];
      return { ...f, photos }; // the cover stays pinned to the same photograph
    });
  }
  function removePhoto(i: number) {
    setForm((f) => {
      if (!f) return f;
      const photos = f.photos.filter((_, k) => k !== i);
      const cover = f.cover && photos.some((p) => p.id === f.cover) ? f.cover : photos[0]?.id ?? null;
      return { ...f, photos, cover };
    });
  }

  async function tidyOrphans(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/admin/photos/${id}`, { method: "DELETE" }).catch(() => {})));
  }

  async function cancel() {
    if (!form) return;
    const added = form.photos.map((p) => p.id).filter((id) => !form.original.includes(id));
    setForm(null);
    if (added.length) tidyOrphans(added);
  }

  async function save() {
    if (!form) return;
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = form.kind === "album" ? "A gallery needs a name." : "A name helps you find it again.";
    if (form.kind === "client" && !form.sub.trim()) errs.sub = "They will need a word to get in.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const photos = form.photos.map((p) => ({ photo_id: p.id, caption: p.cap }));
      if (form.kind === "album") {
        const body = { name: form.name.trim(), subtitle: form.sub.trim(), live: form.live, cover_photo_id: form.cover, photos };
        if (form.id) {
          await api(`/api/admin/albums/${form.id}`, { method: "PATCH", body: JSON.stringify(body) });
          await api(`/api/admin/albums/${form.id}/photos`, { method: "PUT", body: JSON.stringify({ photos }) });
        } else {
          await api("/api/admin/albums", { method: "POST", body: JSON.stringify(body) });
        }
        say(form.live ? "Saved, and it is on the site." : "Saved as a draft — nobody sees it yet.");
      } else {
        const body = { client_name: form.name.trim(), access_word: form.sub.trim().toLowerCase(), shot_on: form.shot || null, expires_on: form.until || plusDaysIso(90), note: form.note.trim(), photos };
        if (form.id) {
          await api(`/api/admin/client-galleries/${form.id}`, { method: "PATCH", body: JSON.stringify(body) });
          await api(`/api/admin/client-galleries/${form.id}/photos`, { method: "PUT", body: JSON.stringify({ photos }) });
        } else {
          await api("/api/admin/client-galleries", { method: "POST", body: JSON.stringify(body) });
        }
        say("Saved. Send them the link when you are ready.");
      }
      const kept = new Set(form.photos.map((p) => p.id));
      const removed = form.original.filter((id) => !kept.has(id));
      setForm(null);
      await reload();
      if (removed.length) tidyOrphans(removed);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function markRead(i: Inquiry) {
    try {
      await api(`/api/admin/inquiries/${i.id}`, { method: "PATCH", body: JSON.stringify({ read: !i.read_at }) });
      setInquiries((prev) => prev.map((x) => (x.id === i.id ? { ...x, read_at: x.read_at ? null : new Date().toISOString() } : x)));
    } catch (e) { say((e as Error).message); }
  }

  /* ---------- render ---------- */
  const tabBtn = (t: Tab, label: string) => (
    <button type="button" onClick={() => { setTab(t); setForm(null); setConfirmId(null); }} className="eyebrow" style={{ background: "none", border: 0, padding: "12px 0", cursor: "pointer", color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)", borderBottom: `2px solid ${tab === t ? "var(--color-accent)" : "transparent"}`, marginBottom: -1 }}>
      {label}{t === "notes" && unread ? ` (${unread})` : ""}
    </button>
  );

  const shareLink = form?.kind === "client"
    ? form.token ? `${origin}/g/${form.token}` : form.sub.trim() ? `${origin}/client-gallery?g=${encodeURIComponent(form.sub.trim().toLowerCase())}` : "Choose a word and the link will appear here."
    : "";

  return (
    <div data-screen="studio">
      <header className="wrap wrap--48" style={{ paddingTop: 68, paddingBottom: 26 }}>
        <p className="aside aside--muted aside--lede" style={{ marginBottom: 14 }}>good morning, Emma</p>
        <h1 className="h1" style={{ fontSize: "3.6rem" }}>The studio</h1>
        <div className="row" style={{ marginTop: 32, gap: 28, borderBottom: "1px solid var(--color-border-soft)" }}>
          {tabBtn("mine", "My galleries")}
          {tabBtn("clients", "Client galleries")}
          {tabBtn("notes", "Notes from the site")}
        </div>
        {!form ? (
          <div className="wrap-row" style={{ marginTop: 24, gap: 16, justifyContent: "space-between" }}>
            <p className="aside aside--muted aside--lede">{loaded ? countLine : "one moment…"}</p>
            {tab !== "notes" ? <Button variant="primary" onClick={startNew}>{tab === "mine" ? "New gallery" : "New client gallery"}</Button> : null}
          </div>
        ) : null}
        <p className="status-line" style={{ marginTop: 18 }} aria-live="polite">{toast}</p>
      </header>

      {/* ---------- lists ---------- */}
      {!form && tab === "mine" ? (
        <section className="wrap wrap--48 col" style={{ paddingBottom: 140, gap: 18 }}>
          {albums.map((a, i) => (
            <div key={a.id} className="card wrap-row" style={{ padding: "22px 26px", gap: 22 }}>
              {a.cover_photo_id ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={thumb(a.cover_photo_id)} alt="" style={{ width: 92, height: 92, objectFit: "cover", borderRadius: "var(--radius-sm)", background: "var(--color-surface-sunken)", flexShrink: 0 }} /> : <div style={{ width: 92, height: 92, borderRadius: "var(--radius-sm)", background: "var(--color-surface-sunken)", flexShrink: 0 }} />}
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div className="wrap-row" style={{ gap: 12, alignItems: "baseline" }}>
                  <h2 className="h4">{a.name}</h2>
                  <Badge on={a.live}>{a.live ? "On the site" : "Draft"}</Badge>
                </div>
                <p className="eyebrow eyebrow--wide" style={{ marginTop: 8 }}>{plural(a.photo_count, "photograph")}{a.subtitle ? ` · ${a.subtitle}` : ""}</p>
                {a.live ? <p className="hand" style={{ marginTop: 6, fontSize: "1.15rem", color: "var(--color-accent)" }}><a href={`/galleries/${a.slug}`} style={{ textDecoration: "none" }}>see it on the site</a></p> : null}
              </div>
              <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                <button type="button" className="icon-btn" title="Show earlier" onClick={() => move("album", a.id, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="icon-btn" title="Show later" onClick={() => move("album", a.id, 1)} disabled={i === albums.length - 1}>↓</button>
              </div>
              <div className="wrap-row" style={{ gap: 12, flexShrink: 0 }}>
                <Button variant="secondary" onClick={() => startEdit("album", a.id)}>Edit</Button>
                <button type="button" className="text-btn" onClick={() => toggleLive(a)}>{a.live ? "Take off the site" : "Put it on the site"}</button>
                <button type="button" className="text-btn text-btn--destructive" onClick={() => remove("album", a.id)}>{confirmId === a.id ? "Yes, take it down" : "Delete"}</button>
              </div>
            </div>
          ))}
          {loaded && !albums.length ? <p className="aside aside--muted aside--lede">Nothing here yet. Plenty of time.</p> : null}
        </section>
      ) : null}

      {!form && tab === "clients" ? (
        <section className="wrap wrap--48 col" style={{ paddingBottom: 140, gap: 18 }}>
          {galleries.map((g, i) => {
            const open = g.expires_on >= today;
            return (
              <div key={g.id} className="card wrap-row" style={{ padding: "22px 26px", gap: 22 }}>
                <GalleryThumb id={g.id} />
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div className="wrap-row" style={{ gap: 12, alignItems: "baseline" }}>
                    <h2 className="h4">{g.client_name}</h2>
                    <Badge on={open}>{open ? "Open" : "Closed"}</Badge>
                  </div>
                  <p className="eyebrow eyebrow--wide" style={{ marginTop: 8 }}>
                    {plural(g.photo_count, "photograph")}{g.shot_on ? ` · photographed ${shortDate(g.shot_on)}` : ""} · here until {shortDate(g.expires_on)}
                    {g.marked_count ? ` · ${g.marked_count} marked for print` : ""}
                    {g.first_opened_at ? ` · opened${g.downloads ? `, downloaded ${g.downloads}×` : ""}` : " · not opened yet"}
                  </p>
                  <p className="hand" style={{ marginTop: 6, fontSize: "1.15rem", color: "var(--color-accent)" }}>the word is {g.access_word}</p>
                </div>
                <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                  <button type="button" className="icon-btn" title="Show earlier" onClick={() => move("client", g.id, -1)} disabled={i === 0}>↑</button>
                  <button type="button" className="icon-btn" title="Show later" onClick={() => move("client", g.id, 1)} disabled={i === galleries.length - 1}>↓</button>
                </div>
                <div className="wrap-row" style={{ gap: 12, flexShrink: 0 }}>
                  <Button variant="secondary" onClick={() => startEdit("client", g.id)}>Edit</Button>
                  <button type="button" className="text-btn" onClick={() => copyLink(g)}>Copy the link</button>
                  <button type="button" className="text-btn text-btn--destructive" onClick={() => remove("client", g.id)}>{confirmId === g.id ? "Yes, take it down" : "Delete"}</button>
                </div>
              </div>
            );
          })}
          {loaded && !galleries.length ? <p className="aside aside--muted aside--lede">Nothing here yet. Plenty of time.</p> : null}
        </section>
      ) : null}

      {!form && tab === "notes" ? (
        <section className="wrap wrap--48 col" style={{ paddingBottom: 140, gap: 18 }}>
          {inquiries.map((n) => (
            <article key={n.id} className="card" style={{ padding: "22px 26px", opacity: n.read_at ? 0.72 : 1 }}>
              <div className="wrap-row" style={{ gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
                <div className="wrap-row" style={{ gap: 12, alignItems: "baseline" }}>
                  <h2 className="h4">{n.name}</h2>
                  <Badge on={!n.read_at}>{n.read_at ? "Read" : "New"}</Badge>
                </div>
                <span className="eyebrow eyebrow--wide">{shortDate(n.created_at.slice(0, 10))}</span>
              </div>
              <p className="eyebrow eyebrow--wide" style={{ marginTop: 8 }}>
                <a href={`mailto:${n.email}`}>{n.email}</a>{n.session_type ? ` · ${n.session_type}` : ""}{n.preferred_date ? ` · ${longDate(n.preferred_date)}` : ""}{n.location ? ` · ${n.location}` : ""}{n.opt_in ? " · wants to hear about fall dates" : ""}
              </p>
              {n.message ? <p className="body" style={{ marginTop: 14, maxWidth: "70ch", whiteSpace: "pre-wrap" }}>{n.message}</p> : null}
              <div className="wrap-row" style={{ marginTop: 14, gap: 12 }}>
                <a className="btn btn--secondary btn--sm" href={`mailto:${n.email}?subject=${encodeURIComponent("Your note to Emma Jane Photography")}`}>Write back</a>
                <button type="button" className="text-btn" onClick={() => markRead(n)}>{n.read_at ? "Mark as new" : "Mark as read"}</button>
              </div>
            </article>
          ))}
          {loaded && !inquiries.length ? <p className="aside aside--muted aside--lede">Nothing here yet. Plenty of time.</p> : null}
        </section>
      ) : null}

      {/* ---------- editor ---------- */}
      {form ? (
        <section className="wrap wrap--48" style={{ paddingBottom: 150 }}>
          <div className="card rise" style={{ padding: "40px 38px 44px" }}>
            <div className="wrap-row" style={{ gap: "12px 24px", alignItems: "baseline", justifyContent: "space-between" }}>
              <h2 className="h3">{form.id ? `Editing ${form.name || "this gallery"}` : form.kind === "album" ? "A new gallery" : "A new client gallery"}</h2>
              <p className="eyebrow eyebrow--wider">{form.id ? "Saved changes go live at once" : "Nobody sees this until you save"}</p>
            </div>

            <div className="grid grid-2" style={{ marginTop: 30, gap: "24px 30px" }}>
              <Input label={form.kind === "album" ? "Gallery name" : "Client name"} placeholder={form.kind === "album" ? "Families, at home" : "The Hartleys"} value={form.name} onChange={(e) => patch({ name: e.target.value })} error={errors.name} />
              <Input label={form.kind === "album" ? "The line under the title" : "The word that opens it"} placeholder={form.kind === "album" ? "Tulsa · morning light" : "goldenfield"} value={form.sub} onChange={(e) => patch({ sub: form.kind === "client" ? e.target.value.toLowerCase() : e.target.value })} error={errors.sub} autoCapitalize={form.kind === "client" ? "none" : undefined} />
              {form.kind === "client" ? <Input label="Photographed on" type="date" value={form.shot} onChange={(e) => patch({ shot: e.target.value })} /> : null}
              {form.kind === "client" ? <Input label="Files here until" type="date" value={form.until} onChange={(e) => patch({ until: e.target.value })} /> : null}
            </div>

            {form.kind === "client" ? (
              <>
                <div style={{ marginTop: 26 }}>
                  <Textarea label="A note at the bottom of their gallery" placeholder="Mark the ones you would like printed and I will get them ordered." rows={3} value={form.note} onChange={(e) => patch({ note: e.target.value })} />
                </div>
                <div style={{ marginTop: 18, padding: "18px 20px", background: "var(--color-bg-alt)", borderRadius: "var(--radius-sm)" }}>
                  <p className="eyebrow eyebrow--wider">The link you send them</p>
                  <p style={{ margin: "8px 0 0", fontSize: "var(--text-body)", wordBreak: "break-all" }}>{shareLink}</p>
                  {form.token ? <p className="eyebrow eyebrow--wide" style={{ marginTop: 8 }}>The word works too — they can type it at /client-gallery.</p> : null}
                </div>
              </>
            ) : null}

            <div style={{ marginTop: 34 }}>
              <p className="eyebrow eyebrow--wider">Photographs</p>
              <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} className="wrap-row" style={{ marginTop: 12, padding: "30px 26px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-paper)", gap: "18px 24px", justifyContent: "space-between" }}>
                <div style={{ minWidth: 0 }}>
                  <p className="hand" style={{ fontSize: "1.35rem" }}>{form.photos.length ? "Drop more in — they land at the end." : "Drag photographs here from your computer."}</p>
                  <p className="eyebrow eyebrow--wide" style={{ marginTop: 8 }}>Full-size files off the card are fine — the web sizes get made for you.</p>
                </div>
                <Button variant="secondary" size="lg" onClick={() => fileRef.current?.click()}>Choose files</Button>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
              </div>

              {busy > 0 ? <p className="aside aside--muted aside--lede" style={{ marginTop: 14 }}>{busy === 1 ? "1 photograph is being made ready…" : `${busy} photographs are being made ready…`}</p> : null}

              {form.photos.length ? (
                <div style={{ marginTop: 8 }}>
                  {form.photos.map((p, i) => {
                    const isCover = form.cover === p.id;
                    return (
                      <div key={p.id} className="wrap-row" style={{ padding: "18px 0", borderTop: "1px solid var(--color-border-soft)", gap: "16px 18px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(p.id)} alt="" style={{ width: 74, height: 74, objectFit: "cover", borderRadius: "var(--radius-sm)", background: "var(--color-surface-sunken)", flexShrink: 0 }} />
                        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                          {form.kind === "album" ? (
                            <Input placeholder="a line in your hand, if it wants one" value={p.cap} onChange={(e) => setForm((f) => f ? { ...f, photos: f.photos.map((x, k) => (k === i ? { ...x, cap: e.target.value } : x)) } : f)} />
                          ) : (
                            <p className="eyebrow eyebrow--wide">{p.marked ? "Marked for print by the client" : `Photograph ${String(i + 1).padStart(2, "0")}`}</p>
                          )}
                        </div>
                        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                          {form.kind === "album" ? (
                            <button type="button" onClick={() => patch({ cover: p.id })} title="Use as the cover" className="btn btn--sm" style={{ minHeight: 40, padding: "0 14px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-eyebrow)", border: `1px solid ${isCover ? "var(--color-accent)" : "var(--color-border)"}`, background: isCover ? "var(--color-accent)" : "transparent", color: isCover ? "var(--color-text-inverse)" : "var(--color-text-muted)" }}>Cover</button>
                          ) : null}
                          <button type="button" className="icon-btn" title="Move earlier" onClick={() => movePhoto(i, -1)} disabled={i === 0}>‹</button>
                          <button type="button" className="icon-btn" title="Move later" onClick={() => movePhoto(i, 1)} disabled={i === form.photos.length - 1}>›</button>
                          <button type="button" className="icon-btn icon-btn--destructive" title="Take this one out" onClick={() => removePhoto(i)}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="wrap-row" style={{ marginTop: 38, gap: 16 }}>
              <Button variant="primary" size="lg" onClick={save} disabled={saving || busy > 0}>{saving ? "Saving…" : form.kind === "album" ? (form.live ? "Save the gallery" : "Save the draft") : "Save the gallery"}</Button>
              {form.kind === "album" ? <Button variant="secondary" size="lg" onClick={() => patch({ live: !form.live })}>{form.live ? "Take off the site" : "Put it on the site"}</Button> : null}
              <button type="button" onClick={cancel} className="text-btn" style={{ minHeight: 54, textTransform: "none", letterSpacing: "var(--tracking-wide)", fontSize: "var(--text-small)" }}>Never mind</button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** The first photograph of a client gallery, fetched lazily so the list stays one request. */
function GalleryThumb({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/client-galleries/${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (alive && d?.photos?.[0]) setSrc(thumb(d.photos[0].photo_id));
    }).catch(() => {});
    return () => { alive = false; };
  }, [id]);
  return src
    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" style={{ width: 92, height: 92, objectFit: "cover", borderRadius: "var(--radius-sm)", background: "var(--color-surface-sunken)", flexShrink: 0 }} />
    : <div style={{ width: 92, height: 92, borderRadius: "var(--radius-sm)", background: "var(--color-surface-sunken)", flexShrink: 0 }} />;
}
