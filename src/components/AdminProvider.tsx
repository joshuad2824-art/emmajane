"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Ctx = {
  isAdmin: boolean;
  editing: boolean;
  setEditing: (on: boolean) => void;
  toast: (msg: string) => void;
};

const AdminContext = createContext<Ctx>({ isAdmin: false, editing: false, setEditing: () => {}, toast: () => {} });
const EDIT_KEY = "ej_editmode_v2";

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  const [editing, setEditingState] = useState(false);
  const [msg, setMsg] = useState("");
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAdmin) { setEditingState(false); return; }
    try { setEditingState(localStorage.getItem(EDIT_KEY) === "1"); } catch {}
  }, [isAdmin]);

  const setEditing = useCallback((on: boolean) => {
    setEditingState(on);
    try { if (on) localStorage.setItem(EDIT_KEY, "1"); else localStorage.removeItem(EDIT_KEY); } catch {}
  }, []);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShown(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 3200);
  }, []);

  // In edit mode, clicking the words inside a link edits them instead of navigating.
  useEffect(() => {
    if (!editing) return;
    const stop = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-editable]") && t.closest("a[href]")) e.preventDefault();
    };
    document.addEventListener("click", stop, true);
    return () => document.removeEventListener("click", stop, true);
  }, [editing]);

  const value = useMemo(() => ({ isAdmin, editing: isAdmin && editing, setEditing, toast }), [isAdmin, editing, setEditing, toast]);

  return (
    <AdminContext.Provider value={value}>
      {children}
      <div className={`toast ${shown ? "toast--show" : ""}`} role="status" aria-live="polite">{msg}</div>
    </AdminContext.Provider>
  );
}
