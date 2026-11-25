"use client";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useAdmin } from "./AdminProvider";

/** Fired by the admin bar after "Undo my edits", so photographs swapped this visit snap back too. */
export const CONTENT_RESET_EVENT = "ej:content-reset";

// Listing the types (rather than `image/*`) makes iPhones convert HEIC photos to JPEG on the way out.
const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff";

async function errorFrom(res: Response, fallback: string) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (body?.error) return body.error;
  if (res.status === 413) return "That file is too large to upload.";
  if (res.status === 401) return "You've been signed out — sign in again to replace photographs.";
  return fallback;
}

export function EditableImg({ k, src, alt, className, style }: { k: string; src: string; alt: string; className?: string; style?: CSSProperties }) {
  const { editing, toast } = useAdmin();
  const [current, setCurrent] = useState(src);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  // When the page re-renders from the server, or "Undo my edits" resets it, show what it now says.
  const latest = useRef(src);
  useEffect(() => { latest.current = src; setCurrent(src); }, [src]);
  useEffect(() => {
    const reset = () => setCurrent(latest.current);
    window.addEventListener(CONTENT_RESET_EVENT, reset);
    return () => window.removeEventListener(CONTENT_RESET_EVENT, reset);
  }, []);

  function pick(e: MouseEvent) {
    if (!editing || busy) return;
    e.preventDefault();
    e.stopPropagation();
    input.current?.click();
  }

  async function upload(file: File) {
    setBusy(true);
    toast("Uploading the photograph…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/photos", { method: "POST", body: fd });
      if (!up.ok) { toast(await errorFrom(up, "That photograph could not be uploaded.")); return; }
      const photo = (await up.json()) as { id: string; web_url: string };
      const res = await fetch("/api/admin/content", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ key: k, kind: "image", value: photo.id }]),
      });
      if (!res.ok) { toast(await errorFrom(res, "The photograph uploaded but did not save — try again.")); return; }
      setCurrent(photo.web_url);
      toast("Photograph replaced.");
    } catch {
      toast("Could not reach the site just now — check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={alt}
        className={className}
        style={{ ...style, opacity: busy ? 0.6 : undefined }}
        data-pickable={editing ? "" : undefined}
        aria-busy={busy || undefined}
        title={editing ? "Click to replace this photograph" : undefined}
        onClick={editing ? pick : undefined}
      />
      {editing ? (
        <input ref={input} type="file" accept={ACCEPT} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
      ) : null}
    </>
  );
}
