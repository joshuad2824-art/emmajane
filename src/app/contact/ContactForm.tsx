"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Select, Textarea } from "@/components/ui";

const SESSION_TYPES = ["Family session", "Senior session", "Wedding", "Couples", "Brand & small business", "Something else"];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [optIn, setOptIn] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      name: fd.get("name"), email: fd.get("email"), session_type: fd.get("session_type"),
      preferred_date: fd.get("preferred_date"), location: fd.get("location"), message: fd.get("message"), opt_in: optIn,
      website: fd.get("website"),
    };
    setBusy(true);
    try {
      const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setSent(true); form.reset(); }
      else setErr((await res.json().catch(() => ({}))).error || "That did not go through — try again, or email me directly.");
    } catch {
      setErr("That did not go through — try again, or email me directly.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rise center" style={{ maxWidth: 560, padding: "48px 40px", background: "var(--color-bg-alt)", border: "1px solid var(--color-border-soft)", borderRadius: "var(--radius-md)" }}>
        <p className="aside" style={{ marginBottom: 12, fontSize: "1.6rem" }}>Thank you — your note is on its way.</p>
        <p className="body muted" style={{ marginBottom: 28 }}>I'll write back within a couple of days with open dates. In the meantime, the fastest way to reach me is hello@emmajanephoto.com.</p>
        <Button variant="secondary" onClick={() => setSent(false)}>Send another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="col" style={{ gap: 26, maxWidth: 560 }} noValidate>
      <div className="row stack-mobile" style={{ gap: 22, alignItems: "flex-start" }}>
        <Input name="name" label="Your name" placeholder="Jane Whitaker" required autoComplete="name" />
        <Input name="email" label="Email" type="email" placeholder="you@email.com" required autoComplete="email" />
      </div>
      <Select name="session_type" label="What are we photographing?" options={SESSION_TYPES} defaultValue={SESSION_TYPES[0]} />
      <div className="row stack-mobile" style={{ gap: 22, alignItems: "flex-start" }}>
        <Input name="preferred_date" label="Date you have in mind" type="date" />
        <Input name="location" label="Where" placeholder="Tulsa, Bixby, somewhere else…" />
      </div>
      <Textarea name="message" label="Tell me a little more" rows={5} placeholder="Who's in the photos, what the day looks like, anything you're hoping for…" />
      <Checkbox label="Send me a note when fall dates open" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
      {/* Honeypot — real people never see or fill this. */}
      <input name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: -9999, opacity: 0, height: 0 }} aria-hidden />
      <div style={{ marginTop: 6 }}>
        <Button type="submit" variant="primary" size="lg" disabled={busy}>{busy ? "Sending…" : "Send your note"}</Button>
      </div>
      {err ? <p className="aside aside--muted" role="alert" style={{ fontSize: "1rem", color: "var(--color-destructive)" }}>{err}</p> : null}
    </form>
  );
}
