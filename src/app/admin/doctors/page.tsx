"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, ExternalLink, Eye, EyeOff, RefreshCw, Search, Stethoscope, Trash2, UserPlus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { Avatar, Chip, ConfirmDialog, EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { DoctorEditor } from "@/components/admin/doctors/DoctorEditor";
import { SERVICES } from "@/lib/data";
import { can } from "@/lib/permissions";
import { doctorName, formatDays, type Doctor, type DoctorInput } from "@/lib/doctors";

type Show = "all" | "published" | "hidden";

const SERVICE_TITLE = new Map<string, string>(SERVICES.map((s) => [s.slug, s.title]));

/** Public doctor and specialist profiles. Content managers and administrators. */
export default function DoctorsAdminPage() {
  const { admin, logout } = useAuth();
  const { addToast } = useAdminData();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const request = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<{ ok: true; value: T } | { ok: false; error: string }> => {
      try {
        const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
        if (res.status === 401) {
          logout();
          return { ok: false, error: "Your session has expired." };
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || "Something went wrong." };
        return { ok: true, value: data as T };
      } catch {
        return { ok: false, error: "Couldn’t reach the server. Check the connection." };
      }
    },
    [logout],
  );

  const reload = useCallback(async () => {
    const r = await request<{ doctors: Doctor[]; needsPlugin?: boolean }>("/api/doctors");
    if (r.ok) {
      setDoctors(r.value.doctors);
      setNeedsPlugin(!!r.value.needsPlugin);
      setLoadError("");
    } else {
      setLoadError(r.error);
    }
    setLoaded(true);
  }, [request]);

  useEffect(() => { reload(); }, [reload]);

  const sortList = (list: Doctor[]) =>
    [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const counts = {
    all: doctors.length,
    published: doctors.filter((d) => d.published).length,
    hidden: doctors.filter((d) => !d.published).length,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (show === "published" && !d.published) return false;
      if (show === "hidden" && d.published) return false;
      if (!q) return true;
      const hay = [doctorName(d), d.specialty, ...d.services.map((s) => SERVICE_TITLE.get(s))].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [doctors, show, query]);

  const closeEditor = useCallback(() => { setEditing(null); setCreating(false); }, []);

  const onSave = async (input: DoctorInput, id?: number) => {
    const r = await request<{ doctor: Doctor }>(id ? `/api/doctors/${id}` : "/api/doctors", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    });
    if (!r.ok) return r.error;
    const saved = r.value.doctor;
    setDoctors((list) => sortList([...list.filter((d) => d.databaseId !== saved.databaseId), saved]));
    addToast(`${id ? "Saved" : "Added"} ${doctorName(saved)}${saved.published ? ", now on the website" : " (hidden)"}`);
    closeEditor();
    return null;
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const r = await request<{ ok: boolean }>(`/api/doctors/${toDelete.databaseId}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.ok) return addToast(r.error, "danger");
    setDoctors((list) => list.filter((d) => d.databaseId !== toDelete.databaseId));
    addToast(`Deleted ${doctorName(toDelete)}`);
    setToDelete(null);
    closeEditor();
  };

  const refresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };
  const closeDelete = useCallback(() => setToDelete(null), []);

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle="Public profiles for the Doctors page and each service page"
        actions={
          <>
            <a className="po-btn" href="/doctors" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} />View page
            </a>
            <button type="button" className="po-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "po-spin" : ""} />Refresh
            </button>
            <button type="button" className="po-btn po-btn--primary" onClick={() => setCreating(true)} disabled={needsPlugin}>
              <UserPlus size={15} />Add profile
            </button>
          </>
        }
      />

      {needsPlugin && (
        <div className="po-alert po-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>WordPress needs the SECH Portal plugin version 1.8.0 before doctor profiles can be kept.</span>
        </div>
      )}
      {loadError && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{loadError}</span>
        </div>
      )}

      <section className="po-card">
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Name, specialty or service" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search profiles" />
          </div>
          <select className="po-select" style={{ width: 190 }} value={show} onChange={(e) => setShow(e.target.value as Show)} aria-label="Show">
            <option value="all">All profiles ({counts.all})</option>
            <option value="published">On the website ({counts.published})</option>
            <option value="hidden">Hidden ({counts.hidden})</option>
          </select>
          {(query || show !== "all") && (
            <button type="button" className="po-btn po-btn--ghost" onClick={() => { setQuery(""); setShow("all"); }}><X size={15} />Clear</button>
          )}
        </div>

        {!loaded ? (
          <SkeletonRows rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={doctors.length ? "No profiles match" : "No doctor profiles yet"}
            text={doctors.length
              ? "Try a different search or filter."
              : "Add the hospital’s doctors and specialists. Each profile links to its service pages and stays hidden until you switch it on."}
            action={
              doctors.length ? (
                <button type="button" className="po-btn" onClick={() => { setQuery(""); setShow("all"); }}><X size={15} />Clear filters</button>
              ) : !needsPlugin ? (
                <button type="button" className="po-btn po-btn--primary" onClick={() => setCreating(true)}><UserPlus size={15} />Add profile</button>
              ) : undefined
            }
          />
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Services</th>
                  <th>Clinic days</th>
                  <th>Website</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.databaseId} data-clickable="true" onClick={() => setEditing(d)}>
                    <td>
                      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                        {d.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.photoUrl} alt="" className="dr-thumb" />
                        ) : (
                          <Avatar name={d.name} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className="po-cell-main">{doctorName(d)}</div>
                          <div className="po-cell-sub">{d.specialty || "No specialty set"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {d.services.length
                          ? d.services.map((s) => <Chip key={s} tone="brand">{SERVICE_TITLE.get(s) ?? s}</Chip>)
                          : <span className="po-cell-sub">None linked</span>}
                      </div>
                    </td>
                    <td>
                      <div className="po-cell-main" style={{ fontWeight: 600 }}>{formatDays(d.clinicDays) || "Not set"}</div>
                      <div className="po-cell-sub">{d.clinicHours ?? ""}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {d.published
                        ? <Chip tone="success"><Eye size={12} /> Shown</Chip>
                        : <Chip tone="muted"><EyeOff size={12} /> Hidden</Chip>}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--po-text-3)" }}><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DoctorEditor
        open={creating || !!editing}
        doctor={editing}
        canUpload={can(admin?.perms, "media.upload")}
        onClose={closeEditor}
        onSave={onSave}
        onDelete={(d) => setToDelete(d)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this profile?"
        text={<>
          <strong>{toDelete ? doctorName(toDelete) : ""}</strong> will be removed from the portal and the website for good.
          To take it off the website but keep it, switch <strong>Shown on the website</strong> off instead.
        </>}
        confirmLabel="Delete"
        icon={Trash2}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={closeDelete}
      />
    </>
  );
}
