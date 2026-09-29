"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  Building2,
  CalendarCog,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserMinus,
  Copy,
  KeySquare,
  Mail,
  Printer,
  Users,
  X,
} from "lucide-react";
import { useAdminData, type NotifSettings } from "@/context/AdminDataContext";
import { ASSIGNABLE_ROLES, TEMP_PASSWORD_ROLES, type AdminUser } from "@/lib/wp-users";
import { HOSPITAL_FIELDS } from "@/lib/wp-settings";
import { ROLE_LABELS } from "@/lib/permissions";
import { passwordStrength as strength } from "@/lib/password-strength";
import {
  Avatar,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Skeleton,
  Switch,
} from "@/components/admin/ui";

type Tab = "hospital" | "booking" | "notifications" | "admins" | "security";

const TABS: { key: Tab; label: string; hint: string; icon: typeof Building2 }[] = [
  { key: "hospital", label: "Hospital profile", hint: "Name, contact and address", icon: Building2 },
  { key: "booking", label: "Bookings", hint: "Hours, slots and departments", icon: CalendarCog },
  { key: "notifications", label: "Notifications", hint: "Alerts and summaries", icon: BellRing },
  { key: "admins", label: "Team access", hint: "Who can use the portal", icon: Users },
  { key: "security", label: "Security", hint: "Your password", icon: ShieldCheck },
];

const NOTIF_DEFS: { key: keyof NotifSettings; label: string; desc: string }[] = [
  { key: "email", label: "Email notifications", desc: "Receive booking updates by email" },
  { key: "sms", label: "SMS notifications", desc: "Receive alerts by SMS (requires an SMS provider)" },
  { key: "newBooking", label: "New booking alert", desc: "When a patient submits a booking" },
  { key: "cancellation", label: "Cancellation alert", desc: "When a booking is cancelled" },
  { key: "daily", label: "Daily summary", desc: "A morning email with the day’s appointments" },
];

export default function SettingsPage() {
  const {
    settings, settingsLoading, settingsError, settingsDirty,
    patchSettings, saveSettings, savingSettings, refreshSettings,
    addDept, removeDept, toggleNotif, addToast,
  } = useAdminData();
  const [tab, setTab] = useState<Tab>("hospital");
  const [newDept, setNewDept] = useState("");

  /* ── Team (WordPress users) ── */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "contributor", username: "" });
  const [inviteMode, setInviteMode] = useState<"email" | "temporary">("email");
  const [usernameTouched, setUsernameTouched] = useState(false);
  /** Shown once, then gone: the portal keeps no copy of a temporary password. */
  const [credentials, setCredentials] = useState<{ name: string; username: string; password: string; reset: boolean } | null>(null);
  const [toReset, setToReset] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);

  // Suggest "ama.mensah" from "Ama Mensah" until the admin edits it.
  const suggestUsername = (name: string) =>
    name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 40);
  const [toRemove, setToRemove] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load team accounts.");
      setUsers(data.users as AdminUser[]);
      setUsersError(null);
    } catch (err: any) {
      setUsersError(err?.message ?? "Could not load team accounts.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "admins" && users.length === 0 && !usersError) loadUsers();
  }, [tab, users.length, usersError, loadUsers]);

  const sendInvite = async () => {
    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteMode === "temporary" ? { ...invite, mode: "temporary" } : invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the account.");
      setInvite({ name: "", email: "", role: "contributor", username: "" });
      setUsernameTouched(false);
      if (inviteMode === "temporary") {
        setCredentials({ name: data.account.name, username: data.account.username, password: data.temporaryPassword, reset: false });
        addToast(`Account created for ${data.account.name}`);
      } else {
        addToast(`Invitation sent to ${data.user.email}`);
      }
      await loadUsers();
    } catch (err: any) {
      addToast(err?.message ?? "Could not send the invitation.", "danger");
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (id: number, role: string) => {
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, roleSlug: role } : u)));
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change the role.");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...data.user, isSelf: u.isSelf } : u)));
      addToast("Role updated");
    } catch (err: any) {
      setUsers(previous);
      addToast(err?.message ?? "Could not change the role.", "danger");
    }
  };

  const resetPassword = async () => {
    if (!toReset) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${toReset.id}/password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset the password.");
      setCredentials({ name: toReset.name, username: toReset.email || toReset.name, password: data.temporaryPassword, reset: true });
      setUsers((prev) => prev.map((u) => (u.id === toReset.id ? { ...u, mustChangePassword: true } : u)));
      setToReset(null);
    } catch (err: any) {
      addToast(err?.message ?? "Could not reset the password.", "danger");
    } finally {
      setResetting(false);
    }
  };

  const removeUser = async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/users/${toRemove.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the account.");
      setUsers((prev) => prev.filter((u) => u.id !== toRemove.id));
      addToast(`${toRemove.name} removed; their posts were reassigned to you`, "danger");
      setToRemove(null);
    } catch (err: any) {
      addToast(err?.message ?? "Could not remove the account.", "danger");
    } finally {
      setRemoving(false);
    }
  };

  /* ── Password ── */
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const pwStrength = useMemo(() => strength(pw.next), [pw.next]);
  const mismatch = pw.confirm.length > 0 && pw.confirm !== pw.next;

  const changePassword = async () => {
    setChangingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the password.");
      setPw({ current: "", next: "", confirm: "" });
      addToast("Password updated");
    } catch (err: any) {
      addToast(err?.message ?? "Could not update the password.", "danger");
    } finally {
      setChangingPw(false);
    }
  };

  const submitNewDept = () => {
    if (!newDept.trim()) return;
    addDept(newDept.trim());
    setNewDept("");
  };

  const savesToWordPress = tab === "hospital" || tab === "booking" || tab === "notifications";

  return (
    <>
      <PageHeader title="Settings" subtitle="Hospital details, booking rules and who can use the portal" />

      <div className="st-layout">
        {/* Section nav */}
        <nav className="ad-card st-nav" aria-label="Settings sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} type="button" className="st-nav-item" data-active={active} onClick={() => setTab(t.key)} aria-current={active ? "page" : undefined}>
                {active && <motion.span layoutId="st-nav-pill" className="st-nav-pill" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                <span className="st-nav-icon"><Icon size={17} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="st-nav-label">{t.label}</span>
                  <span className="st-nav-hint">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ minWidth: 0 }}>
          {settingsError && savesToWordPress && (
            <div className="ad-alert ad-tone-danger" style={{ marginBottom: 16 }}>
              <AlertTriangle size={17} />{settingsError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              {tab === "hospital" && (
                <Card title="Hospital profile" subtitle="Shown on the website’s contact details and footer">
                  {settingsLoading ? (
                    <div className="st-grid">{HOSPITAL_FIELDS.map((f) => <Skeleton key={f.key} h={60} r={10} />)}</div>
                  ) : (
                    <>
                      <div className="st-grid">
                        {HOSPITAL_FIELDS.map((f) => (
                          <label key={f.key} className="ad-field">
                            <span className="ad-label">{f.label}</span>
                            <input className="ad-input" value={(settings[f.key] as string) ?? ""} onChange={(e) => patchSettings({ [f.key]: e.target.value })} />
                          </label>
                        ))}
                      </div>
                      <label className="ad-field" style={{ marginTop: 16 }}>
                        <span className="ad-label">About the hospital</span>
                        <textarea className="ad-textarea" rows={4} value={settings.about ?? ""} onChange={(e) => patchSettings({ about: e.target.value })} />
                      </label>
                    </>
                  )}
                </Card>
              )}

              {tab === "booking" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <Card title="Outpatient hours" subtitle="Used to offer appointment times on the booking form">
                    <div className="st-grid st-grid--3">
                      {([
                        { label: "Opens", key: "opdOpen" as const, placeholder: "08:00" },
                        { label: "Closes", key: "opdClose" as const, placeholder: "16:00" },
                        { label: "Slot length (minutes)", key: "slotLength" as const, placeholder: "30" },
                      ]).map((f) => (
                        <label key={f.key} className="ad-field">
                          <span className="ad-label">{f.label}</span>
                          <input className="ad-input" placeholder={f.placeholder} value={settings[f.key] ?? ""} onChange={(e) => patchSettings({ [f.key]: e.target.value })} disabled={settingsLoading} />
                        </label>
                      ))}
                    </div>
                  </Card>

                  <Card title="Departments" subtitle={`${settings.departments.length} department${settings.departments.length === 1 ? "" : "s"} patients can book into`}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      <AnimatePresence initial={false}>
                        {settings.departments.map((d) => (
                          <motion.span key={d} layout className="st-dept" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            {d}
                            <button type="button" onClick={() => removeDept(d)} aria-label={`Remove ${d}`}><X size={13} /></button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {settings.departments.length === 0 && !settingsLoading && (
                        <span className="ad-hint">No departments yet — add the first below.</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="ad-input" value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Add a department, e.g. Physiotherapy"
                        onKeyDown={(e) => { if (e.key === "Enter") submitNewDept(); }} />
                      <button type="button" className="ad-btn" onClick={submitNewDept} disabled={!newDept.trim()}><Plus size={15} />Add</button>
                    </div>
                  </Card>
                </div>
              )}

              {tab === "notifications" && (
                <Card title="Notifications" subtitle="How the team hears about new activity" bodyClassName="">
                  {NOTIF_DEFS.map((item, i) => (
                    <div key={item.key} className="st-row" style={{ borderTop: i === 0 ? "1px solid var(--ad-border)" : undefined }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ad-text)" }}>{item.label}</div>
                        <div className="ad-hint">{item.desc}</div>
                      </div>
                      <Switch checked={!!settings.notifications[item.key]} onChange={() => toggleNotif(item.key)} label={item.label} />
                    </div>
                  ))}
                </Card>
              )}

              {tab === "admins" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <Card
                    title="Team access"
                    subtitle="WordPress accounts that can sign in to this portal"
                    bodyClassName=""
                    action={<button type="button" className="ad-btn ad-btn--sm" onClick={loadUsers} disabled={usersLoading}><RefreshCw size={14} className={usersLoading ? "ad-spin" : ""} />Refresh</button>}
                  >
                    {usersLoading && users.length === 0 ? (
                      <div style={{ padding: "0 18px 18px", display: "grid", gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={44} r={10} />)}</div>
                    ) : usersError ? (
                      <EmptyState icon={AlertTriangle} title="Couldn’t load the team" text={usersError}
                        action={<button type="button" className="ad-btn" onClick={loadUsers}><RefreshCw size={15} />Try again</button>} />
                    ) : (
                      <div className="ad-table-wrap">
                        <table className="ad-table">
                          <thead><tr><th>Person</th><th>Role</th><th style={{ textAlign: "right" }}>Access</th></tr></thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                                    <Avatar name={u.name} />
                                    <div style={{ minWidth: 0 }}>
                                      <div className="ad-cell-main">
                                        {u.name} {u.isSelf && <Chip tone="brand">You</Chip>}
                                        {u.mustChangePassword && <span className="ad-badge ad-tone-warn" style={{ textTransform: "none", marginLeft: 6 }}>Temporary password</span>}
                                      </div>
                                      <div className="ad-cell-sub">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ width: 200 }}>
                                  <select className="ad-select" style={{ height: 34 }} value={u.roleSlug} onChange={(e) => changeRole(u.id, e.target.value)} disabled={u.isSelf}
                                    title={u.isSelf ? "You cannot change your own role" : undefined} aria-label={`Role for ${u.name}`}>
                                    {ASSIGNABLE_ROLES.map((r) => <option key={r.slug} value={r.slug}>{r.label}</option>)}
                                    {!ASSIGNABLE_ROLES.some((r) => r.slug === u.roleSlug) && <option value={u.roleSlug}>{u.role}</option>}
                                  </select>
                                </td>
                                <td>
                                  <div className="ad-row-actions">
                                    {!u.isSelf && u.roleSlug !== "administrator" && (
                                      <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => setToReset(u)}
                                        title="Give them a new temporary password">
                                        <KeySquare size={14} />Reset password
                                      </button>
                                    )}
                                    <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => setToRemove(u)} disabled={u.isSelf}
                                      title={u.isSelf ? "You cannot remove your own account" : "Remove access"} style={{ color: "var(--ad-danger)" }}>
                                      <UserMinus size={14} />Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  <Card title="What each role can do">
                    <div className="st-roles">
                      {ASSIGNABLE_ROLES.map((r) => (
                        <div key={r.slug} className="st-role">
                          <strong>{r.label}</strong>
                          <span>{ROLE_LABELS[r.slug]?.description}</span>
                          <em>{r.slug === "administrator" || r.slug === "editor" ? "Admin console" : "Staff area"}</em>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card
                    title="Add a colleague"
                    subtitle={inviteMode === "email"
                      ? "WordPress emails them a link to choose their own password — you never handle it."
                      : "For staff without reliable email. You get a one-time password to hand over in person; they must replace it when they first sign in."}
                    action={
                      <div className="ad-seg" role="tablist" aria-label="How to give access">
                        {([["email", "Email invite", Mail], ["temporary", "Temporary password", KeySquare]] as const).map(([v, label, Icon]) => (
                          <button key={v} type="button" role="tab" className="ad-seg-btn" aria-selected={inviteMode === v}
                            onClick={() => {
                              setInviteMode(v);
                              // Administrators are never created with a temporary password.
                              if (v === "temporary" && !TEMP_PASSWORD_ROLES.includes(invite.role)) setInvite((p) => ({ ...p, role: "contributor" }));
                            }}>
                            {inviteMode === v && <motion.span layoutId="st-invite-mode" className="ad-seg-pill" />}
                            <Icon size={14} />{label}
                          </button>
                        ))}
                      </div>
                    }
                  >
                    <div className="st-invite" data-mode={inviteMode}>
                      <input className="ad-input" value={invite.name} aria-label="Full name" placeholder="Full name"
                        onChange={(e) => {
                          const name = e.target.value;
                          setInvite((p) => ({ ...p, name, username: usernameTouched ? p.username : suggestUsername(name) }));
                        }} />
                      {inviteMode === "temporary" && (
                        <input className="ad-input" value={invite.username} aria-label="Username" placeholder="Username, e.g. ama.mensah"
                          autoCapitalize="none" spellCheck={false}
                          onChange={(e) => { setUsernameTouched(true); setInvite((p) => ({ ...p, username: e.target.value.toLowerCase() })); }} />
                      )}
                      <input className="ad-input" type="email" value={invite.email} aria-label="Email address"
                        placeholder={inviteMode === "email" ? "Email address" : "Email (optional)"}
                        onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} />
                      <select className="ad-select" value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))} aria-label="Role">
                        {ASSIGNABLE_ROLES.filter((r) => inviteMode === "email" || TEMP_PASSWORD_ROLES.includes(r.slug))
                          .map((r) => <option key={r.slug} value={r.slug}>{r.label}</option>)}
                      </select>
                      <button type="button" className="ad-btn ad-btn--primary" onClick={sendInvite}
                        disabled={inviting || !invite.name.trim() || (inviteMode === "email" ? !invite.email.trim() : !/^[a-z0-9._-]{3,40}$/.test(invite.username))}>
                        {inviteMode === "email" ? <Send size={15} /> : <KeySquare size={15} />}
                        {inviting ? "Working…" : inviteMode === "email" ? "Send invite" : "Create account"}
                      </button>
                    </div>
                    <p className="ad-hint" style={{ margin: "10px 0 0" }}>
                      <strong style={{ color: "var(--ad-text-2)" }}>{ASSIGNABLE_ROLES.find((r) => r.slug === invite.role)?.label}:</strong>{" "}
                      {ROLE_LABELS[invite.role]?.description}
                      {inviteMode === "temporary" && " · Administrators can only be added by email invite."}
                    </p>
                  </Card>
                </div>
              )}

              {tab === "security" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <Card title="Change your password" icon={KeyRound} subtitle="Your current password is checked before anything changes">
                    <form
                      style={{ maxWidth: 460, display: "grid", gap: 14 }}
                      onSubmit={(e) => { e.preventDefault(); if (!mismatch && pw.current && pw.next && pw.confirm) changePassword(); }}
                    >
                      {/* Hidden username field so password managers file the new password correctly. */}
                      <input type="text" name="username" autoComplete="username" hidden readOnly value="" />
                      {([
                        { label: "Current password", key: "current" as const, auto: "current-password" },
                        { label: "New password", key: "next" as const, auto: "new-password" },
                        { label: "Confirm new password", key: "confirm" as const, auto: "new-password" },
                      ]).map((f) => (
                        <label key={f.key} className="ad-field">
                          <span className="ad-label">{f.label}</span>
                          <div className="ad-input-wrap">
                            <input className="ad-input" style={{ paddingLeft: 12, paddingRight: 40 }} type={showPw ? "text" : "password"} value={pw[f.key]}
                              autoComplete={f.auto} onChange={(e) => setPw((p) => ({ ...p, [f.key]: e.target.value }))} />
                            {f.key === "current" && (
                              <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" style={{ position: "absolute", right: 4 }}
                                onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide passwords" : "Show passwords"}>
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            )}
                          </div>
                          {f.key === "next" && pw.next && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <span key={n} className={`ad-tone-${pwStrength.tone}`} style={{ height: 4, borderRadius: 2, background: n <= pwStrength.score ? "var(--tone)" : "var(--ad-surface-3)", transition: "background .2s" }} />
                                ))}
                              </div>
                              <span className={`ad-tone-${pwStrength.tone}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--tone)", minWidth: 76, textAlign: "right" }}>{pwStrength.label}</span>
                            </div>
                          )}
                          {f.key === "confirm" && mismatch && <span style={{ fontSize: 12, color: "var(--ad-danger)" }}>Doesn’t match the new password</span>}
                        </label>
                      ))}
                      <p className="ad-hint" style={{ margin: 0 }}>Use at least 12 characters. A short phrase of unrelated words is easy to remember and hard to guess.</p>
                      <div>
                        <button type="submit" className="ad-btn ad-btn--primary" disabled={changingPw || !pw.current || !pw.next || !pw.confirm || mismatch}>
                          <KeyRound size={15} />{changingPw ? "Updating…" : "Update password"}
                        </button>
                      </div>
                    </form>
                  </Card>

                  <Card title="Two-step sign-in" icon={ShieldCheck}>
                    <div className="ad-alert ad-tone-info" style={{ alignItems: "flex-start" }}>
                      <ShieldCheck size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>
                        Not set up yet. Two-step sign-in is handled by WordPress, so it needs a 2FA plugin installed there
                        (for example “Two Factor”). Once WordPress requires a second step, this portal’s sign-in follows it.
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Unsaved-changes bar for WordPress-backed settings */}
      <AnimatePresence>
        {settingsDirty && (
          <motion.div
            className="ad-bulkbar"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="status"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ad-gold)" }} />
              Unsaved changes
            </span>
            <span className="ad-bulkbar-sep" />
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => refreshSettings()} disabled={savingSettings}>
              <RotateCcw size={14} />Discard
            </button>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--gold" onClick={saveSettings} disabled={savingSettings}>
              <Save size={14} />{savingSettings ? "Saving…" : "Save changes"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!toReset}
        icon={KeySquare}
        tone="primary"
        title={`Reset ${toReset?.name ?? ""}’s password?`}
        text={<>They’ll be signed out everywhere and given a new temporary password, which you’ll see once. At their next sign-in they must choose their own.</>}
        confirmLabel="Reset password"
        busy={resetting}
        onConfirm={resetPassword}
        onCancel={() => setToReset(null)}
      />

      <CredentialsDialog credentials={credentials} onDone={() => setCredentials(null)} onCopied={(what) => addToast(`${what} copied`)} />

      <ConfirmDialog
        open={!!toRemove}
        icon={Trash2}
        title={`Remove ${toRemove?.name ?? ""}?`}
        text={<>Their WordPress account will be deleted and they will no longer be able to sign in. Any posts they wrote will be reassigned to you, not deleted.</>}
        confirmLabel="Remove access"
        busy={removing}
        onConfirm={removeUser}
        onCancel={() => setToRemove(null)}
      />

      <style>{`
        .st-layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 20px; align-items: start; }
        @media (max-width: 900px) { .st-layout { grid-template-columns: minmax(0, 1fr); } .st-nav { display: flex !important; overflow-x: auto; } .st-nav-hint { display: none !important; } }
        .st-nav { padding: 6px; display: grid; gap: 2px; position: sticky; top: 0; }
        .st-nav-item { position: relative; isolation: isolate; display: flex; gap: 12px; align-items: center; text-align: left; padding: 10px 12px; border: 0; background: none; border-radius: 10px; cursor: pointer; font: inherit; color: var(--ad-text-2); white-space: nowrap; }
        .st-nav-item:hover { background: var(--ad-surface-2); }
        .st-nav-pill { position: absolute; inset: 0; z-index: -1; border-radius: 10px; background: var(--ad-brand-soft); }
        .st-nav-icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; background: var(--ad-surface-3); color: var(--ad-text-2); flex-shrink: 0; }
        .st-nav-item[data-active="true"] .st-nav-icon { background: var(--ad-surface); color: var(--ad-brand-ink); }
        .st-nav-label { display: block; font-weight: 650; font-size: 13.5px; color: var(--ad-text); }
        .st-nav-hint { display: block; font-size: 12px; color: var(--ad-text-3); }
        .st-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
        .st-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 640px) { .st-grid, .st-grid--3 { grid-template-columns: minmax(0, 1fr); } }
        .st-dept { display: inline-flex; align-items: center; gap: 6px; padding: 5px 6px 5px 12px; border-radius: 999px; background: var(--ad-brand-soft); color: var(--ad-brand-ink); font-size: 13px; font-weight: 600; }
        .st-dept button { width: 20px; height: 20px; border-radius: 50%; border: 0; background: transparent; color: inherit; display: grid; place-items: center; cursor: pointer; opacity: .7; }
        .st-dept button:hover { opacity: 1; background: rgba(0,0,0,0.06); }
        .st-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 18px; border-bottom: 1px solid var(--ad-border); }
        .st-row:last-child { border-bottom: 0; }
        .st-roles { display: grid; gap: 2px; }
        .st-role { display: grid; grid-template-columns: 160px minmax(0, 1fr) auto; gap: 12px; align-items: baseline; padding: 9px 0; border-bottom: 1px solid var(--ad-border); font-size: 13px; }
        .st-role:last-child { border-bottom: 0; }
        .st-role strong { color: var(--ad-text); }
        .st-role span { color: var(--ad-text-2); }
        .st-role em { font-style: normal; font-size: 11.5px; font-weight: 700; color: var(--ad-text-3); white-space: nowrap; }
        @media (max-width: 700px) { .st-role { grid-template-columns: 1fr; gap: 2px; } }
        .st-invite { display: grid; grid-template-columns: 1.2fr 1.5fr 0.9fr auto; gap: 8px; }
        .st-invite[data-mode="temporary"] { grid-template-columns: 1.2fr 1.1fr 1.2fr 0.9fr auto; }
        @media (max-width: 900px) { .st-invite { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
    </>
  );
}

/**
 * The one and only time a temporary password is shown. Nothing is stored:
 * closing this dialog is the end of it — resetting again makes a new one.
 */
function CredentialsDialog({ credentials, onDone, onCopied }: {
  credentials: { name: string; username: string; password: string; reset: boolean } | null;
  onDone: () => void;
  onCopied: (what: string) => void;
}) {
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(() => onCopied(what), () => {});
  };
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/admin/login` : "/admin/login";

  const printSlip = () => {
    if (!credentials) return;
    // A plain slip for handing over, opened in its own window and printed from
    // there — the password never goes into the page's history or storage.
    const w = window.open("", "_blank", "width=480,height=600");
    if (!w) return;
    const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    w.document.write(`<!doctype html><title>Sign-in details</title>
      <body style="font:15px/1.6 system-ui,sans-serif;padding:32px;color:#111">
      <h2 style="margin:0 0 4px">St. Elizabeth Catholic Hospital</h2>
      <p style="margin:0 0 20px;color:#555">Staff portal sign-in for ${esc(credentials.name)}</p>
      <p><b>Sign in at:</b><br>${esc(loginUrl)}</p>
      <p><b>Username:</b><br><code style="font-size:18px">${esc(credentials.username)}</code></p>
      <p><b>Temporary password:</b><br><code style="font-size:20px;letter-spacing:1px">${esc(credentials.password)}</code></p>
      <p style="margin-top:24px;padding:12px;border:1px solid #ccc;border-radius:8px">You will be asked to choose your own password the first time you sign in. Please destroy this slip afterwards.</p>
      <script>window.onload=()=>{window.print()}<\/script></body>`);
    w.document.close();
  };

  return (
    <AnimatePresence>
      {credentials && (
        <motion.div className="ad-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}>
          <motion.div className="ad-modal" style={{ maxWidth: 480 }} role="dialog" aria-modal="true" aria-label="Temporary sign-in details"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
            <div className="ad-kpi-icon ad-tone-success" style={{ marginBottom: 14 }}><KeySquare size={18} /></div>
            <h3 className="ad-modal-title">{credentials.reset ? "New temporary password" : "Account created"}</h3>
            <p className="ad-modal-text" style={{ marginBottom: 14 }}>
              Give these to <strong>{credentials.name}</strong> in person. <strong>This is the only time the password is shown</strong> — the portal keeps no copy.
            </p>

            <div className="st-cred">
              <span className="st-cred-label">Sign in at</span>
              <code>{loginUrl}</code>
              <span className="st-cred-label">Username</span>
              <div className="st-cred-row">
                <code>{credentials.username}</code>
                <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={() => copy(credentials.username, "Username")} aria-label="Copy username"><Copy size={14} /></button>
              </div>
              <span className="st-cred-label">Temporary password</span>
              <div className="st-cred-row">
                <code className="st-cred-pw">{credentials.password}</code>
                <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={() => copy(credentials.password, "Password")} aria-label="Copy password"><Copy size={14} /></button>
              </div>
            </div>

            <p className="ad-hint" style={{ margin: "12px 0 18px" }}>
              Avoid sending it by WhatsApp or SMS where it stays in chat history. They must choose their own password the first time they sign in.
            </p>
            <div className="ad-modal-actions">
              <button type="button" className="ad-btn" onClick={printSlip}><Printer size={15} />Print slip</button>
              <button type="button" className="ad-btn ad-btn--primary" onClick={onDone} autoFocus>I’ve noted it — done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <style>{`
        .st-cred { display: grid; gap: 4px; padding: 14px; border-radius: 12px; background: var(--ad-surface-2); border: 1px solid var(--ad-border); }
        .st-cred-label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ad-text-3); margin-top: 6px; }
        .st-cred-label:first-child { margin-top: 0; }
        .st-cred code { font: 600 14px ui-monospace, Menlo, monospace; color: var(--ad-text); overflow-wrap: anywhere; }
        .st-cred-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .st-cred-pw { font-size: 19px !important; letter-spacing: .04em; color: var(--ad-brand-ink) !important; }
      `}</style>
    </AnimatePresence>
  );
}
