import type { CSSProperties } from "react";
import { textFor, imageFor } from "@/lib/content";
import { EditableText } from "./EditableText";
import { EditableImg } from "./EditableImg";

/**
 * A piece of owner-editable copy. `children` is the default text compiled into the site;
 * an override saved under `k` in the content table wins when present.
 */
export async function Editable({
  k, as = "span", className, style, multiline, children,
}: { k: string; as?: string; className?: string; style?: CSSProperties; multiline?: boolean; children: string }) {
  const text = await textFor(k, children);
  return <EditableText k={k} tag={as} text={text} className={className} style={style} multiline={multiline} />;
}

/** An owner-replaceable photograph. `src` is the compiled-in default. */
export async function EditableImage({
  k, src, alt, className, style,
}: { k: string; src: string; alt: string; className?: string; style?: CSSProperties }) {
  const resolved = await imageFor(k, src);
  return <EditableImg k={k} src={resolved} alt={alt} className={className} style={style} />;
}
