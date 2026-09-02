"use client";
import { createElement, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useAdmin } from "./AdminProvider";

export function EditableText({
  k, tag, text, className, style, multiline,
}: { k: string; tag: string; text: string; className?: string; style?: CSSProperties; multiline?: boolean }) {
  const { editing, toast } = useAdmin();
  const ref = useRef<HTMLElement>(null);
  const [saved, setSaved] = useState(text);
  useEffect(() => setSaved(text), [text]);

  async function commit() {
    const el = ref.current;
    if (!el) return;
    const next = (el.textContent ?? "").trim();
    if (next === saved) return;
    if (!next) { el.textContent = saved; return; }
    const res = await fetch("/api/admin/content", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: k, kind: "text", value: next }]),
    });
    if (res.ok) { setSaved(next); }
    else { el.textContent = saved; toast("That edit did not save — are you still signed in?"); }
  }

  function onKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
    if (e.key === "Escape") { if (ref.current) ref.current.textContent = saved; (e.currentTarget as HTMLElement).blur(); }
  }

  return createElement(tag, {
    ref,
    className,
    style,
    "data-editable": editing ? "" : undefined,
    "data-key": k,
    contentEditable: editing ? true : undefined,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onBlur: editing ? commit : undefined,
    onKeyDown: editing ? onKey : undefined,
  }, saved);
}
