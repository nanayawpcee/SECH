"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Images, Loader2, X } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { GALLERY_MAX } from "@/lib/wp-posts";

export type GalleryItem = { id: number; url: string };
type Pending = { key: string; url: string };

/**
 * Extra photos for the article page's slider. The featured image stays the
 * one photo on news cards and leads the slider; these follow it, in order.
 * The parent owns the list and saves it with the post.
 */
export function PostGalleryCard({
  items,
  setItems,
  onChange,
  canUpload,
  loading,
  needsPlugin,
}: {
  items: GalleryItem[];
  setItems: Dispatch<SetStateAction<GalleryItem[]>>;
  onChange: () => void;
  canUpload: boolean;
  loading: boolean;
  needsPlugin: boolean;
}) {
  const { addToast } = useAdminData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const room = GALLERY_MAX - items.length - pending.length;

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => {
      if (!f.type.startsWith("image/")) { addToast(`${f.name} isn’t an image`, "warn"); return false; }
      if (f.size > 8 * 1024 * 1024) { addToast(`${f.name} is over 8 MB. Please use a smaller one.`, "warn"); return false; }
      return true;
    });
    if (files.length > room) addToast(`A gallery holds up to ${GALLERY_MAX} photos; only the first ${Math.max(0, room)} were added.`, "warn");
    const batch = files.slice(0, Math.max(0, room)).map((f, i) => ({ file: f, key: `${Date.now()}-${i}`, url: URL.createObjectURL(f) }));
    if (!batch.length) return;
    setPending((p) => [...p, ...batch.map(({ key, url }) => ({ key, url }))]);

    // One at a time, so a slow connection doesn't time every upload out at once.
    let added = 0;
    for (const b of batch) {
      const form = new FormData();
      form.append("file", b.file);
      try {
        const res = await fetch("/api/media", { method: "POST", body: form });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "The upload failed");
        setItems((list) => [...list, { id: result.id, url: result.url || b.url }]);
        added++;
        onChange();
      } catch (err) {
        addToast(`${b.file.name}: ${err instanceof Error ? err.message : "upload failed"}`, "danger");
      } finally {
        setPending((p) => p.filter((x) => x.key !== b.key));
      }
    }
    if (added) addToast(`${added} photo${added === 1 ? "" : "s"} added to the gallery`);
  };

  const move = (i: number, dir: -1 | 1) => {
    setItems((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    onChange();
  };

  const remove = (i: number) => {
    setItems((list) => list.filter((_, k) => k !== i));
    onChange();
  };

  return (
    <Card title="Photo gallery" subtitle="Extra photos for a slider on the article page. News cards show only the featured image.">
      {needsPlugin ? (
        <p className="po-hint" style={{ margin: 0 }}>WordPress needs the SECH Portal plugin version 1.9.0 before posts can have a gallery.</p>
      ) : loading ? (
        <div className="pg-grid"><span className="pg-tile pg-tile--busy"><Loader2 size={18} className="po-spin" /></span></div>
      ) : (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />

          {items.length + pending.length > 0 && (
            <ol className="pg-grid">
              {items.map((it, i) => (
                <li key={it.id} className="pg-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt="" />
                  <span className="pg-num">{i + 2}</span>
                  <div className="pg-actions">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}><ChevronLeft size={14} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move photo ${i + 1} later`}><ChevronRight size={14} /></button>
                    <button type="button" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`} data-danger="true"><X size={14} /></button>
                  </div>
                </li>
              ))}
              {pending.map((p) => (
                <li key={p.key} className="pg-tile pg-tile--busy">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" />
                  <span className="pg-busy"><Loader2 size={18} className="po-spin" /></span>
                </li>
              ))}
            </ol>
          )}

          {canUpload ? (
            <div
              className="pg-drop"
              data-over={dragOver || undefined}
              role="button"
              tabIndex={0}
              aria-disabled={room <= 0}
              onClick={() => room > 0 && inputRef.current?.click()}
              onKeyDown={(e) => { if (room > 0 && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (room > 0 && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
            >
              {items.length ? <ImagePlus size={18} /> : <Images size={20} />}
              <span>
                <strong>{room > 0 ? (items.length ? "Add more photos" : "Add photos") : "Gallery is full"}</strong>
                <small>{room > 0 ? `Drop several at once, or click to choose. ${items.length}/${GALLERY_MAX}` : `Remove a photo to add another. ${GALLERY_MAX}/${GALLERY_MAX}`}</small>
              </span>
            </div>
          ) : (
            <p className="po-hint" style={{ margin: 0 }}>Your account can’t upload images. The administrator who reviews your post can add photos.</p>
          )}
          {items.length > 0 && <p className="po-hint" style={{ margin: "10px 0 0" }}>The featured image is photo 1; these follow it in this order.</p>}
        </>
      )}
    </Card>
  );
}
