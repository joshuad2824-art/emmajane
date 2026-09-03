"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAdmin } from "./AdminProvider";

function pagePrefix(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!seg) return "home";
  if (seg === "client-gallery" || seg === "g") return "client";
  return seg;
}

export function AdminBar() {
  const { isAdmin, editing, setEditing, toast } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (res.ok) {
        setPw("");
        setOpen(false);
        toast("Signed in. Turn on editing to change text and photographs.");
        router.refresh();
      } else if (res.status === 429) {
        setErr("Too many tries. Give it a few minutes.");
      } else if (res.status === 401) {
        setErr("That isn't it.");
      } else {
        setErr((await res.json().catch(() => ({}))).error || "Something went wrong on the site's side.");
      }
    } catch {
      setErr("Could not reach the site just now.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setEditing(false);
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function undo() {
    if (!confirm("Put this page's words and photographs back the way they were?")) return;
    const res = await fetch(`/api/admin/content?prefix=${encodeURIComponent(pagePrefix(pathname) + ".")}`, { method: "DELETE" });
    if (res.ok) {
      toast("This page is back the way it was.");
      router.refresh();
    } else {
      toast("That did not work — try again.");
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-strip" data-chrome>
        {!open ? (
          <button type="button" className="admin-strip__open" onClick={() => setOpen(true)}>Admin</button>
        ) : (
          <form className="admin-strip__form" onSubmit={signIn}>
            <input className="admin-strip__pw" type="password" placeholder="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Admin password" />
            <button type="submit" className="admin-strip__go" disabled={busy}>Sign in</button>
            <span className="admin-strip__err" role="alert">{err}</span>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="admin-bar" data-chrome>
      <span className="admin-bar__status">{editing ? "Editing — click any words or photograph" : "Signed in as Emma"}</span>
      <button type="button" className={`admin-bar__btn ${editing ? "admin-bar__btn--on" : ""}`} onClick={() => setEditing(!editing)}>
        {editing ? "Done editing" : "Edit this page"}
      </button>
      <Link href="/studio" className="admin-bar__btn">Galleries</Link>
      <button type="button" className="admin-bar__quiet" onClick={undo}>Undo my edits</button>
      <button type="button" className="admin-bar__quiet" onClick={signOut}>Sign out</button>
    </div>
  );
}
