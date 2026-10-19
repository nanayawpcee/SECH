"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, ImagePlus, Info, Loader2, Trash2, X } from "lucide-react";
import { Avatar, Switch } from "@/components/admin/ui";
import { useAdminData } from "@/context/AdminDataContext";
import { SERVICES } from "@/lib/data";
import { BIO_MAX, DAYS, DOCTOR_TITLES, doctorName, type DayCode, type Doctor, type DoctorInput } from "@/lib/doctors";

const EMPTY: DoctorInput = {
  title: "Dr.", name: "", specialty: "", services: [], clinicDays: [], clinicHours: "",
  bio: "", photoId: 0, published: false, sortOrder: 0,
};

function toForm(d: Doctor | null): DoctorInput {
  if (!d) return EMPTY;
  return {
    title: d.title ?? "", name: d.name, specialty: d.specialty ?? "", services: d.services ?? [],
    clinicDays: d.clinicDays ?? [], clinicHours: d.clinicHours ?? "", bio: d.bio ?? "",
    photoId: d.photoId ?? 0, published: d.published, sortOrder: d.sortOrder ?? 0,
  };
}

/** Services sorted by name, for the link picker. */
const SERVICE_OPTIONS = [...SERVICES].sort((a, b) => a.title.localeCompare(b.title));

/**
 * Add or edit one public profile, in a side drawer. Everything here can
 * appear on the public website, so there are no contact details: patients
 * reach doctors through the hospital's own lines and booking form.
 */
export function DoctorEditor({
  open,
  doctor,
  canUpload,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  doctor: Doctor | null;
  canUpload: boolean;
  onClose: () => void;
  onSave: (input: DoctorInput, id?: number) => Promise<string | null>;
  onDelete: (d: Doctor) => void;
}) {
  const { addToast } = useAdminData();
  const [form, setForm] = useState<DoctorInput>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(doctor));
      setPhotoUrl(doctor?.photoUrl ?? null);
      setError("");
    }
  }, [open, doctor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = <K extends keyof DoctorInput>(key: K, value: DoctorInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = <T extends string>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return addToast("Please choose an image file", "warn");
    if (file.size > 8 * 1024 * 1024) return addToast("That image is over 8 MB. Please use a smaller one.", "warn");
    const before = { url: photoUrl, id: form.photoId };
    setPhotoUrl(URL.createObjectURL(file));
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/media", { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "The upload failed");
      set("photoId", result.id);
      if (result.url) setPhotoUrl(result.url);
    } catch (err) {
      addToast(`Upload failed: ${err instanceof Error ? err.message : "could not save the image"}`, "danger");
      setPhotoUrl(before.url);
      set("photoId", before.id);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return setError("A name is required.");
    if (form.bio.length > BIO_MAX) return setError(`Keep the bio to ${BIO_MAX} characters.`);
    setSaving(true);
    setError("");
    const problem = await onSave(form, doctor?.databaseId);
    setSaving(false);
    if (problem) setError(problem);
  };

  const display = form.name.trim() ? doctorName({ title: form.title, name: form.name }) : "New profile";
  const busy = saving || uploading;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="po-overlay po-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.aside
            className="po-drawer st-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={doctor ? `Edit ${display}` : "Add a doctor or specialist"}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }} /* same unit as initial/exit, or the exit never completes */
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="po-drawer-head">
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <Avatar name={form.name || "?"} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 750, color: "var(--po-text)" }}>{display}</div>
                  <div className="po-cell-sub">{doctor ? "Edit public profile" : "Add a doctor or specialist"}</div>
                </div>
              </div>
              <button type="button" className="po-btn po-btn--ghost po-btn--icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <form className="po-drawer-body st-form" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
              <p className="st-note"><Info size={14} />Everything on this form can appear on the public website. Don’t add phone numbers or personal email addresses.</p>

              <h3 className="st-h">Visibility</h3>
              <div className="dr-publish">
                <div>
                  <strong>{form.published ? <><Eye size={15} />Shown on the website</> : <><EyeOff size={15} />Hidden</>}</strong>
                  <span className="po-hint">{form.published ? "Listed on the Doctors page and on each linked service page." : "Saved in the portal only. Switch on when the profile is ready."}</span>
                </div>
                <Switch checked={form.published} onChange={(v) => set("published", v)} label="Show on the website" />
              </div>

              <h3 className="st-h">Name and specialty</h3>
              <div className="st-grid st-grid--name">
                <label className="po-field">
                  <span className="po-label">Title</span>
                  <select className="po-select" value={form.title} onChange={(e) => set("title", e.target.value)}>
                    <option value="">None</option>
                    {DOCTOR_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="po-field" style={{ gridColumn: "span 2" }}>
                  <span className="po-label">Full name *</span>
                  <input className="po-input" value={form.name} maxLength={80} onChange={(e) => set("name", e.target.value)}
                    autoFocus={!doctor} placeholder="e.g. Ama Serwaa Mensah" />
                </label>
              </div>
              <label className="po-field" style={{ marginBottom: 12 }}>
                <span className="po-label">Specialty</span>
                <input className="po-input" value={form.specialty} maxLength={80} onChange={(e) => set("specialty", e.target.value)}
                  placeholder="e.g. Obstetrician & Gynaecologist" />
              </label>

              <h3 className="st-h">Linked services</h3>
              <p className="po-hint" style={{ margin: "0 0 10px" }}>
                The profile links to these service pages, and appears on each of them. Choose up to 8.
              </p>
              <div className="dr-pills" role="group" aria-label="Linked services">
                {SERVICE_OPTIONS.map((s) => {
                  const on = form.services.includes(s.slug);
                  return (
                    <button key={s.slug} type="button" className="dr-pill" aria-pressed={on}
                      disabled={!on && form.services.length >= 8}
                      onClick={() => setForm((f) => ({ ...f, services: toggle(f.services, s.slug) }))}>
                      {s.title}
                    </button>
                  );
                })}
              </div>

              <h3 className="st-h">Clinic days</h3>
              <div className="dr-days" role="group" aria-label="Clinic days">
                {DAYS.map((d) => {
                  const on = form.clinicDays.includes(d.code);
                  return (
                    <button key={d.code} type="button" className="dr-day" aria-pressed={on} aria-label={d.long}
                      onClick={() => setForm((f) => ({ ...f, clinicDays: toggle<DayCode>(f.clinicDays, d.code) }))}>
                      {d.short}
                    </button>
                  );
                })}
              </div>
              <label className="po-field" style={{ marginTop: 12 }}>
                <span className="po-label">Clinic hours</span>
                <input className="po-input" value={form.clinicHours} maxLength={60} onChange={(e) => set("clinicHours", e.target.value)}
                  placeholder="e.g. 8am to 1pm" />
                <span className="po-hint">Leave the days empty if this person doesn’t run a set clinic.</span>
              </label>

              <h3 className="st-h">Photo</h3>
              <div className="dr-photo">
                <div className="dr-photo-frame">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" />
                  ) : (
                    <span>{(form.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase()}</span>
                  )}
                  {uploading && <span className="dr-photo-busy"><Loader2 size={20} className="po-spin" /></span>}
                </div>
                <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                  {canUpload ? (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" hidden
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
                      <button type="button" className="po-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
                        <ImagePlus size={15} />{photoUrl ? "Replace photo" : "Upload photo"}
                      </button>
                      {photoUrl && (
                        <button type="button" className="po-btn po-btn--ghost" onClick={() => { set("photoId", 0); setPhotoUrl(null); }} disabled={busy}>
                          <X size={15} />Remove photo
                        </button>
                      )}
                      <span className="po-hint">A real photo of this person only. Square or slightly wide works best. Until then, their initials are shown.</span>
                    </>
                  ) : (
                    <span className="po-hint">Your account can’t upload images. An administrator can add the photo.</span>
                  )}
                </div>
              </div>

              <h3 className="st-h">Short bio</h3>
              <textarea className="po-input" rows={4} value={form.bio} maxLength={BIO_MAX} onChange={(e) => set("bio", e.target.value)}
                style={{ resize: "vertical", minHeight: 100 }} aria-label="Short bio"
                placeholder="Training, experience and areas of interest, in two or three sentences." />
              <span className="po-hint" style={{ display: "block", textAlign: "right", marginTop: 4 }}>{form.bio.length}/{BIO_MAX}</span>

              <h3 className="st-h">Order</h3>
              <label className="po-field" style={{ maxWidth: 200 }}>
                <span className="po-label">Display order</span>
                <input className="po-input" type="number" min={0} max={999} value={form.sortOrder}
                  onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
                <span className="po-hint">Lower numbers come first; equal numbers sort by name.</span>
              </label>

              {error && (
                <div className="po-alert po-tone-danger" role="alert" style={{ marginTop: 16 }}>
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
                </div>
              )}
              <button type="submit" hidden />
            </form>

            <div className="po-drawer-foot">
              {doctor && (
                <button type="button" className="po-btn po-btn--ghost" style={{ marginRight: "auto", color: "var(--po-danger)" }} onClick={() => onDelete(doctor)}>
                  <Trash2 size={15} />Delete
                </button>
              )}
              <button type="button" className="po-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className="po-btn po-btn--primary" onClick={save} disabled={busy}>
                {saving ? <><Loader2 size={15} className="po-spin" />Saving…</> : doctor ? "Save changes" : "Add profile"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
