"use client";

import { useState } from "react";
import { useAdminData, type NotifSettings } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";

const TABS = ["Hospital Info", "Booking Settings", "Notifications", "Admins", "Security"];

const ADMIN_USERS = [
  { name: "Admin User", email: "admin@sech-gh.org", role: "Super Admin", active: true },
  { name: "Dr. Kwame Asante", email: "kwame@sech-gh.org", role: "Editor", active: true },
  { name: "Sr. Mary-Rose Adjei", email: "mradjei@sech-gh.org", role: "Viewer", active: false },
];

const NOTIF_DEFS: { key: keyof NotifSettings; label: string; desc: string }[] = [
  { key: "email", label: "Email notifications", desc: "Receive booking updates via email" },
  { key: "sms", label: "SMS notifications", desc: "Receive alerts via SMS (requires Twilio)" },
  { key: "newBooking", label: "New booking alert", desc: "Notify when a patient submits a new booking" },
  { key: "cancellation", label: "Cancellation alert", desc: "Notify when a booking is cancelled" },
  { key: "daily", label: "Daily summary digest", desc: "Morning email with the day's appointments" },
];

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
  const { depts, addDept, removeDept, notifs, toggleNotif, addToast } = useAdminData();
  const [tab, setTab] = useState("Hospital Info");
  const [saving, setSaving] = useState(false);
  const [newDept, setNewDept] = useState("");

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    addToast("Settings saved successfully");
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
            onClick={save}
            disabled={saving}
            style={{
              padding: "7px 18px",
              background: "#0A4F3C",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
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
                  {[
                    { label: "Hospital name", defaultValue: "St. Elizabeth Catholic Hospital" },
                    { label: "Short name", defaultValue: "SECH" },
                    { label: "Phone", defaultValue: "+233 322 298 428" },
                    { label: "Email", defaultValue: "info@sech-gh.org" },
                    { label: "Website", defaultValue: "https://sech-gh.org" },
                    { label: "Address", defaultValue: "Hwidiem, Asutifi North District" },
                    { label: "Region", defaultValue: "Brong-Ahafo Region" },
                    { label: "Country", defaultValue: "Ghana" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                        {f.label}
                      </label>
                      <input defaultValue={f.defaultValue} style={fieldStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                    About / Description
                  </label>
                  <textarea
                    defaultValue="A CHAG member institution providing compassionate Catholic healthcare to Ghana's Brong-Ahafo Region since the 1970s."
                    style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                  />
                </div>
              </div>
            )}

            {/* Booking Settings */}
            {tab === "Booking Settings" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Booking &amp; Appointment Settings</h3>

                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 12 }}>Appointment Time Slots</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px" }}>
                    {[
                      { label: "OPD Open", defaultValue: "07:30" },
                      { label: "OPD Close", defaultValue: "17:00" },
                      { label: "Slot length", defaultValue: "30" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                          {f.label}
                        </label>
                        <input defaultValue={f.defaultValue} style={fieldStyle} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 12 }}>Active Departments</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {depts.map((d) => (
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
                    {ADMIN_USERS.map((u) => (
                      <tr key={u.email} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
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
                              {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: 10, color: "#666" }}>{u.email}</td>
                        <td style={{ padding: 10 }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 500,
                              background: u.role === "Super Admin" ? "#FEF3C7" : "#EFF6FF",
                              color: u.role === "Super Admin" ? "#d97706" : "#1565C0",
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: 10 }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 500,
                              background: u.active ? "#DCFCE7" : "#F3F4F6",
                              color: u.active ? "#16a34a" : "#999",
                            }}
                          >
                            {u.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: 10 }}>
                          <button
                            onClick={() => addToast("Admin edit not wired up in this prototype", "warn")}
                            style={{ padding: "4px 10px", border: "0.5px solid #d1d5db", borderRadius: 5, fontSize: 12, background: "#fff", cursor: "pointer", color: "#555" }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => addToast("Invite flow not wired up in this prototype", "warn")}
                  style={{ marginTop: 16, padding: "8px 16px", background: "#0A4F3C", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  + Invite Admin
                </button>
              </div>
            )}

            {/* Security */}
            {tab === "Security" && (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 20 }}>Security Settings</h3>
                <div style={{ maxWidth: 440 }}>
                  {["Current password", "New password", "Confirm new password"].map((label) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                        {label}
                      </label>
                      <input type="password" style={fieldStyle} placeholder="••••••••" />
                    </div>
                  ))}
                  <button
                    onClick={() => addToast("Password update not wired up in this prototype", "warn")}
                    style={{ padding: "8px 18px", background: "#0A4F3C", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Update password
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
