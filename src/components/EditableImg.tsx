"use client";
import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useAdmin } from "./AdminProvider";

export function EditableImg({ k, src, alt, className, style }: { k: string; src: string; alt: string; className?: string; style?: CSSProperties }) {
  const { editing, toast } = useAdmin();
  const [current, setCurrent] = useState(src);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function pick(e: MouseEvent) {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    input.current?.click();
  }

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/photos", { method: "POST", body: fd });
      if (!up.ok) { toast((await up.json().catch(() => ({}))).error || "That photograph could not be uploaded."); return; }
      const photo = (await up.json()) as { id: string; web_url: string };
      const res = await fetch("/api/admin/content", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ key: k, kind: "image", value: photo.id }]),
      });
      if (!res.ok) { toast("The photograph uploaded but did not save — try again."); return; }
      setCurrent(photo.web_url);
      toast("Photograph replaced.");
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
        title={editing ? "Click to replace this photograph" : undefined}
        onClick={editing ? pick : undefined}
      />
      {editing ? (
        <input ref={input} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
      ) : null}
    </>
  );
}
