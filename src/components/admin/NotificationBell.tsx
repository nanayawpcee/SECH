"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAdminData, toastDotColor } from "@/context/AdminDataContext";

export function NotificationBell() {
  const { toasts, toastPanelOpen, toggleToastPanel } = useAdminData();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toastPanelOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        toggleToastPanel();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [toastPanelOpen, toggleToastPanel]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="admin-icon-btn"
        onClick={toggleToastPanel}
        aria-label="Notifications"
        aria-expanded={toastPanelOpen}
        title="Notifications"
      >
        <Bell size={17} strokeWidth={2} />
        {toasts.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#DC2626",
              border: "1.5px solid #fff",
            }}
          />
        )}
      </button>

      {toastPanelOpen && (
        <div
          className="admin-notif-panel"
          style={{
            position: "absolute",
            top: 42,
            right: 0,
            width: 320,
            background: "#fff",
            border: "0.5px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(13,31,26,0.14)",
            zIndex: 400,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "11px 14px",
              borderBottom: "0.5px solid #f3f4f6",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#111",
            }}
          >
            Notifications
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {toasts.length === 0 ? (
              <div style={{ padding: 26, textAlign: "center", color: "#B7C3BD", fontSize: 12.5 }}>
                No notifications yet
              </div>
            ) : (
              toasts.slice(0, 12).map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "0.5px solid #f5f7f6",
                    display: "flex",
                    gap: 9,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: toastDotColor(t.kind),
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: 12.5, color: "#333", lineHeight: 1.5 }}>{t.msg}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
