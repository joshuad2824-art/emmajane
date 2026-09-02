"use client";
import { useCallback, useState } from "react";
import { Lightbox } from "@/components/Lightbox";

const SPANS = [3, 3, 2, 2, 2, 4, 2, 3, 3, 2, 2, 2];
const RATIOS = ["4/3", "4/5", "1/1", "3/4", "4/5", "16/9", "1/1", "3/2", "4/5", "4/5", "1/1", "3/4"];

export function AlbumMosaic({ photos }: { photos: { id: string; caption: string }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const captions = photos.filter((p) => p.caption.trim());
  return (
    <>
      <div className="grid mosaic" style={{ gridTemplateColumns: "repeat(6, 1fr)", gridAutoFlow: "dense", gap: 10 }}>
        {photos.map((p, i) => (
          <figure key={p.id} className="rise" style={{ margin: 0, gridColumn: `span ${SPANS[i % SPANS.length]}`, background: "var(--color-surface-sunken)", cursor: "zoom-in", animationDelay: `${Math.min(i, 8) * 40}ms` }} onClick={() => setOpen(`/api/photos/${p.id}/web`)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${p.id}/web`} alt={p.caption} loading={i > 5 ? "lazy" : undefined} style={{ width: "100%", height: "100%", aspectRatio: RATIOS[i % RATIOS.length], objectFit: "cover" }} />
          </figure>
        ))}
      </div>
      {captions.length ? (
        <div className="col" style={{ marginTop: 40, gap: 10 }}>
          {captions.map((c) => <p key={c.id} className="hand muted" style={{ fontSize: "1.25rem" }}>{c.caption}</p>)}
        </div>
      ) : null}
      <Lightbox src={open} onClose={close} />
    </>
  );
}
