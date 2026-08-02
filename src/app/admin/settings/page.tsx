"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminData, type NotifSettings } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { ASSIGNABLE_ROLES, type AdminUser } from "@/lib/wp-users";
import { HOSPITAL_FIELDS } from "@/lib/wp-settings";

const TABS = ["Hospital Info", "Booking Settings", "Notifications", "Admins", "Security"];

const NOTIF_DEFS: { key: keyof NotifSettings; label: string; desc: string }[] = [
  { key: "email", label: "Email notifications", desc: "Receive booking updates via email" },
  { key: "sms", label: "SMS notifications", desc: "Receive alerts via SMS (requires Twilio)" },
  { key: "newBooking", label: "New booking alert", desc: "Notify when a patient submits a new booking" },
  { key: "cancellation", label: "Cancellation alert", desc: "Notify when a booking is cancelled" },
  { key: "daily", label: "Daily summary digest", desc: "Morning email with the day's appointments" },
];

const secondaryBtn: React.CSSProperties = {
  padding: "6px 14px",
  border: "0.5px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
  color: "#555",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  border: "0.5px solid #e5e7eb",
  borderRadius: 6,
  padding: "8px 10px",
  background: "#fff",
  color: "#111",
  outline: "none",
  fontFamily: "inherit",
};

export default function SettingsPage() {
  const {
    settings,
    settingsLoading,
    settingsError,
    settingsDirty,
    patchSettings,
    saveSettings,
    savingSettings,
    addDept,
    removeDept,
    toggleNotif,
    addToast,
  } = useAdminData();
  const depts = settings.departments;
  const notifs = settings.notifications;
  const [tab, setTab] = useState("Hospital Info");
  const [newDept, setNewDept] = useState("");

  /* ── Admin users (WordPress-backed) ── */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "editor" });

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load admin users.");
      setUsers(data.users as AdminUser[]);
      setUsersError(null);
    } catch (err: any) {
      setUsersError(err?.message ?? "Could not load admin users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Only fetch once the tab is actually opened.
  useEffect(() => {
    if (tab === "Admins" && users.length === 0 && !usersError) loadUsers();
  }, [tab, users.length, usersError, loadUsers]);

  const sendInvite = async () => {
    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the invitation.");
      setInvite({ name: "", email: "", role: "editor" });
      addToast(`Invitation sent to ${data.user.email}`);
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

  const removeUser = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the account.");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      addToast(`${user.name} removed; their posts were reassigned to you`, "danger");
    } catch (err: any) {
      addToast(err?.message ?? "Could not remove the account.", "danger");
    }
  };

  /* ── Password change ── */
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const changePassword = async () => {
    setChangingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
          confirmPassword: pw.confirm,
        }),
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

  return (
    <>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Settings</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={saveSettings}
            disabled={savingSettings || settingsLoading}
            style={{
              padding: "7px 18px",
              background: "#0A4F3C",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: savingSettings || settingsLoading ? 0.7 : 1,
            }}
          >
            {savingSettings ? "Saving…" : settingsDirty ? "Save changes •" : "Save changes"}
          </button>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, alignItems: "start" }}>
          {/* Sidebar tabs */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  fontSize: 13,
                  background: tab === t ? "#F0F7F4" : "#fff",
                  color: tab === t ? "#0A4F3C" : "#555",
                  fontWeight: tab === t ? 600 : 400,
                  border: "none",
                  borderLeft: `2px solid ${tab === t ? "#0A4F3C" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderBottom: "0.5px solid #f3f4f6",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {/* Hospital Info */}
            {tab === "Hospital Info" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Hospital Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                  {HOSPITAL_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                        {f.label}
                      </label>
                      <input
                        value={(settings[f.key] as string) ?? ""}
                        onChange={(e) => patchSettings({ [f.key]: e.target.value })}
                        disabled={settingsLoading}
                        style={fieldStyle}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                    About / Description
                  </label>
                  <textarea
                    value={settings.about ?? ""}
                    onChange={(e) => patchSettings({ about: e.target.value })}
                    disabled={settingsLoading}
                    style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                  />
                </div>
                {settingsError && (
                  <div style={{ marginTop: 12, color: "#DC2626", fontSize: 12.5 }}>{settingsError}</div>
                )}
              </div>
            )}

            {/* Booking Settings */}
            {tab === "Booking Settings" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Booking &amp; Appointment Settings</h3>

                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 12 }}>Appointment Time Slots</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px" }}>
                    {([
                      { label: "OPD Open", key: "opdOpen" as const },
                      { label: "OPD Close", key: "opdClose" as const },
                      { label: "Slot length (mins)", key: "slotLength" as const },
                    ]).map((f) => (
                      <div key={f.key}>
                        <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                          {f.label}
                        </label>
                        <input
                          value={settings[f.key] ?? ""}
                          onChange={(e) => patchSettings({ [f.key]: e.target.value })}
                          disabled={settingsLoading}
                          style={fieldStyle}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 12 }}>Active Departments</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {depts.map((d: string) => (
                      <div
                        key={d}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          background: "#F0F7F4",
                          border: "0.5px solid #B6D9C8",
                          borderRadius: 20,
                          fontSize: 12,
                          color: "#0A4F3C",
                        }}
                      >
                        {d}
                        <button
                          onClick={() => removeDept(d)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, lineHeight: 1, padding: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="Add new department…"
                      style={{ ...fieldStyle, flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNewDept();
                      }}
                    />
                    <button
                      onClick={submitNewDept}
                      style={{ padding: "8px 16px", background: "#0A4F3C", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {tab === "Notifications" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Notification Preferences</h3>
                {NOTIF_DEFS.map((item) => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{item.desc}</div>
                    </div>
                    <div
                      onClick={() => toggleNotif(item.key)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        cursor: "pointer",
                        flexShrink: 0,
                        background: notifs[item.key] ? "#0A4F3C" : "#d1d5db",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.2s",
                          left: notifs[item.key] ? 23 : 3,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admins */}
            {tab === "Admins" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Admin Users</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid #e5e7eb" }}>
                      {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#aaa", fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#bbb", fontSize: 13 }}>
                          Loading accounts from WordPress…
                        </td>
                      </tr>
                    ) : usersError ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 28, textAlign: "center", fontSize: 13 }}>
                          <div style={{ color: "#DC2626", marginBottom: 10 }}>{usersError}</div>
                          <button onClick={loadUsers} style={secondaryBtn}>
                            Try again
                          </button>
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                          <td style={{ padding: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "#0A4F3C",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#E8B84B",
                                  flexShrink: 0,
                                }}
                              >
                                {u.initials}
                              </div>
                              <span style={{ fontWeight: 500 }}>{u.name}</span>
                              {u.isSelf && (
                                <span style={{ fontSize: 11, color: "#93A29B" }}>(you)</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: 10, color: "#666" }}>{u.email}</td>
                          <td style={{ padding: 10 }}>
                            <select
                              value={u.roleSlug}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              style={{
                                fontSize: 12,
                                border: "0.5px solid #d1d5db",
                                borderRadius: 6,
                                padding: "4px 8px",
                                background: "#fff",
                                color: "#555",
                              }}
                            >
                              {ASSIGNABLE_ROLES.map((r) => (
                                <option key={r.slug} value={r.slug}>
                                  {r.label}
                                </option>
                              ))}
                              {/* Keep any role WordPress reports that we don't offer. */}
                              {!ASSIGNABLE_ROLES.some((r) => r.slug === u.roleSlug) && (
                                <option value={u.roleSlug}>{u.role}</option>
                              )}
                            </select>
                          </td>
                          <td style={{ padding: 10, color: "#777", fontSize: 12 }}>{u.role}</td>
                          <td style={{ padding: 10 }}>
                            <button
                              onClick={() => removeUser(u)}
                              disabled={u.isSelf}
                              title={u.isSelf ? "You cannot remove your own account" : undefined}
                              style={{
                                padding: "4px 10px",
                                border: "0.5px solid #FCA5A5",
                                borderRadius: 5,
                                fontSize: 12,
                                background: "#fff",
                                cursor: u.isSelf ? "not-allowed" : "pointer",
                                color: "#DC2626",
                                opacity: u.isSelf ? 0.4 : 1,
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Invite */}
                <div
                  style={{
                    marginTop: 22,
                    paddingTop: 18,
                    borderTop: "0.5px solid #f3f4f6",
                  }}
                >
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                    Invite a colleague
                  </h4>
                  <p style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                    WordPress emails them a link to choose their own password — you never
                    handle it.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      value={invite.name}
                      onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full name"
                      style={{ ...fieldStyle, flex: "1 1 160px", width: "auto" }}
                    />
                    <input
                      value={invite.email}
                      onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email address"
                      type="email"
                      style={{ ...fieldStyle, flex: "1 1 200px", width: "auto" }}
                    />
                    <select
                      value={invite.role}
                      onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
                      style={{ ...fieldStyle, width: "auto" }}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={sendInvite}
                      disabled={inviting || !invite.name.trim() || !invite.email.trim()}
                      style={{
                        padding: "8px 16px",
                        background: "#0A4F3C",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: inviting ? "wait" : "pointer",
                        opacity: !invite.name.trim() || !invite.email.trim() ? 0.5 : 1,
                      }}
                    >
                      {inviting ? "Sending…" : "Send invite"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {tab === "Security" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Security Settings</h3>
                <div style={{ maxWidth: 440 }}>
                  {(
                    [
                      { label: "Current password", key: "current" as const, autoComplete: "current-password" },
                      { label: "New password", key: "next" as const, autoComplete: "new-password" },
                      { label: "Confirm new password", key: "confirm" as const, autoComplete: "new-password" },
                    ]
                  ).map((f) => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                        {f.label}
                      </label>
                      <input
                        type="password"
                        value={pw[f.key]}
                        autoComplete={f.autoComplete}
                        onChange={(e) => setPw((p) => ({ ...p, [f.key]: e.target.value }))}
                        style={fieldStyle}
                        placeholder="••••••••"
                      />
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 12px" }}>
                    Use at least 12 characters. Your current password is verified before
                    anything changes.
                  </p>
                  <button
                    onClick={changePassword}
                    disabled={changingPw || !pw.current || !pw.next || !pw.confirm}
                    style={{
                      padding: "8px 18px",
                      background: "#0A4F3C",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: changingPw ? "wait" : "pointer",
                      opacity: !pw.current || !pw.next || !pw.confirm ? 0.5 : 1,
                    }}
                  >
                    {changingPw ? "Updating…" : "Update password"}
                  </button>
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "0.5px solid #e5e7eb" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6 }}>Two-Factor Authentication</h4>
                  <p style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>Add an extra layer of security to your admin account.</p>
                  <button
                    onClick={() => addToast("2FA setup not wired up in this prototype", "warn")}
                    style={{ padding: "8px 18px", border: "0.5px solid #0A4F3C", color: "#0A4F3C", background: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
