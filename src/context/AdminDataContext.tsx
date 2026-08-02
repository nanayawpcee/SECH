"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Post } from "@/app/admin/data";
import type { AdminBooking } from "@/lib/wp-bookings";
import { EMPTY_SETTINGS, type HospitalSettings } from "@/lib/wp-settings";

export type ToastKind = "success" | "warn" | "danger";

export interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

export function toastDotColor(kind: ToastKind): string {
  return kind === "danger" ? "#DC2626" : kind === "warn" ? "#d97706" : "#16a34a";
}

export interface NotifSettings {
  email: boolean;
  sms: boolean;
  newBooking: boolean;
  cancellation: boolean;
  daily: boolean;
}

interface AdminDataCtx {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  posts: Post[];
  postsLoading: boolean;
  postsError: string | null;
  refreshPosts: () => Promise<void>;
  updatePost: (id: number, patch: Partial<Post>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  togglePostStatus: (id: number) => Promise<void>;

  bookings: AdminBooking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  refreshBookings: () => Promise<void>;
  confirmBooking: (databaseId: number) => Promise<void>;
  cancelBooking: (databaseId: number) => Promise<void>;

  /** Hospital profile + booking config, persisted in WordPress. */
  settings: HospitalSettings;
  settingsLoading: boolean;
  settingsError: string | null;
  settingsDirty: boolean;
  /** Edits locally; nothing is written until saveSettings() runs. */
  patchSettings: (patch: Partial<HospitalSettings>) => void;
  saveSettings: () => Promise<void>;
  savingSettings: boolean;

  addDept: (d: string) => void;
  removeDept: (d: string) => void;
  toggleNotif: (key: keyof NotifSettings) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  toasts: Toast[];
  poppingToast: Toast | null;
  toastPanelOpen: boolean;
  toggleToastPanel: () => void;
  addToast: (msg: string, kind?: ToastKind) => void;

  /** Unsaved-changes guard for the post editor — lets the sidebar nav
   *  intercept a route change instead of silently discarding edits. */
  editorDirty: boolean;
  setEditorDirty: (dirty: boolean) => void;
  guardTarget: string | null;
  requestLeave: (href: string) => boolean;
  confirmLeave: () => string | null;
  cancelLeave: () => void;
}

const AdminDataContext = createContext<AdminDataCtx | null>(null);

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return ctx;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [settings, setSettings] = useState<HospitalSettings>(EMPTY_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [poppingToast, setPoppingToast] = useState<Toast | null>(null);
  const [toastPanelOpen, setToastPanelOpen] = useState(false);
  const [editorDirty, setEditorDirtyState] = useState(false);
  const [guardTarget, setGuardTarget] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  const addToast = useCallback((msg: string, kind: ToastKind = "success") => {
    const toast: Toast = { id: Date.now() + Math.random(), msg, kind };
    setToasts((prev) => [toast, ...prev].slice(0, 30));
    setPoppingToast(toast);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setPoppingToast(null), 2800);
  }, []);

  const refreshPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load posts.");
      setPosts(data.posts as Post[]);
      setPostsError(null);
    } catch (err: any) {
      setPostsError(err?.message ?? "Could not load posts.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const updatePost = useCallback(
    async (id: number, patch: Partial<Post>) => {
      const previous = posts;
      // Optimistic: the table updates immediately, and rolls back if WP refuses.
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      try {
        const res = await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not save the post.");
        setPosts((prev) => prev.map((p) => (p.id === id ? (data.post as Post) : p)));
      } catch (err: any) {
        setPosts(previous);
        addToast(err?.message ?? "Could not save the post.", "danger");
        throw err;
      }
    },
    [posts, addToast],
  );

  const deletePost = useCallback(
    async (id: number) => {
      const previous = posts;
      setPosts((prev) => prev.filter((p) => p.id !== id));
      try {
        const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not delete the post.");
        addToast("Post moved to trash", "danger");
      } catch (err: any) {
        setPosts(previous);
        addToast(err?.message ?? "Could not delete the post.", "danger");
      }
    },
    [posts, addToast],
  );

  const togglePostStatus = useCallback(
    async (id: number) => {
      const post = posts.find((p) => p.id === id);
      if (!post) return;
      const next: Post["status"] = post.status === "published" ? "draft" : "published";
      try {
        await updatePost(id, { status: next });
        addToast(next === "published" ? "Post published" : "Moved to drafts");
      } catch {
        // updatePost has already surfaced the failure and rolled back.
      }
    },
    [posts, updatePost, addToast],
  );

  const refreshBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load bookings.");
      setBookings(data.bookings as AdminBooking[]);
      setBookingsError(null);
    } catch (err: any) {
      setBookingsError(err?.message ?? "Could not load bookings.");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const setBookingStatus = useCallback(
    async (databaseId: number, status: AdminBooking["status"], message: string) => {
      const previous = bookings;
      setBookings((prev) =>
        prev.map((b) => (b.databaseId === databaseId ? { ...b, status } : b)),
      );
      try {
        const res = await fetch(`/api/bookings/${databaseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update the booking.");
        addToast(message, status === "cancelled" ? "danger" : "success");
      } catch (err: any) {
        setBookings(previous);
        addToast(err?.message ?? "Could not update the booking.", "danger");
      }
    },
    [bookings, addToast],
  );

  const confirmBooking = useCallback(
    (databaseId: number) => setBookingStatus(databaseId, "confirmed", "Booking confirmed"),
    [setBookingStatus],
  );
  const cancelBooking = useCallback(
    (databaseId: number) => setBookingStatus(databaseId, "cancelled", "Booking cancelled"),
    [setBookingStatus],
  );

  /* ── Hospital settings ── */
  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load settings.");
      setSettings(data.settings as HospitalSettings);
      setSettingsError(null);
      setSettingsDirty(false);
    } catch (err: any) {
      setSettingsError(err?.message ?? "Could not load settings.");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const patchSettings = useCallback((patch: Partial<HospitalSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSettingsDirty(true);
  }, []);

  const saveSettings = useCallback(async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save settings.");
      // Trust WordPress's copy over ours, so sanitisation is reflected.
      setSettings(data.settings as HospitalSettings);
      setSettingsDirty(false);
      addToast("Settings saved");
    } catch (err: any) {
      addToast(err?.message ?? "Could not save settings.", "danger");
    } finally {
      setSavingSettings(false);
    }
  }, [settings, addToast]);

  const addDept = useCallback(
    (d: string) => {
      const v = d.trim();
      if (!v) return;
      setSettings((prev) =>
        prev.departments.includes(v)
          ? prev
          : { ...prev, departments: [...prev.departments, v] },
      );
      setSettingsDirty(true);
    },
    [],
  );

  const removeDept = useCallback((d: string) => {
    setSettings((prev) => ({
      ...prev,
      departments: prev.departments.filter((x) => x !== d),
    }));
    setSettingsDirty(true);
  }, []);

  const toggleNotif = useCallback((key: keyof NotifSettings) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
    setSettingsDirty(true);
  }, []);

  /* ── Theme ── */
  useEffect(() => {
    const stored = localStorage.getItem("sech_admin_theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("sech_admin_theme", next);
      return next;
    });
  }, []);

  const toggleToastPanel = useCallback(() => setToastPanelOpen((v) => !v), []);

  const setEditorDirty = useCallback((dirty: boolean) => setEditorDirtyState(dirty), []);

  /** Returns true when navigation should proceed immediately; false means
   *  it was intercepted and a confirm dialog is now pending. */
  const requestLeave = useCallback(
    (href: string) => {
      if (editorDirty) {
        setGuardTarget(href);
        return false;
      }
      return true;
    },
    [editorDirty],
  );
  const confirmLeave = useCallback(() => {
    const target = guardTarget;
    setEditorDirtyState(false);
    setGuardTarget(null);
    return target;
  }, [guardTarget]);
  const cancelLeave = useCallback(() => setGuardTarget(null), []);

  return (
    <AdminDataContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        posts,
        postsLoading,
        postsError,
        refreshPosts,
        updatePost,
        deletePost,
        togglePostStatus,
        bookings,
        bookingsLoading,
        bookingsError,
        refreshBookings,
        confirmBooking,
        cancelBooking,
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
        theme,
        toggleTheme,
        toasts,
        poppingToast,
        toastPanelOpen,
        toggleToastPanel,
        addToast,
        editorDirty,
        setEditorDirty,
        guardTarget,
        requestLeave,
        confirmLeave,
        cancelLeave,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
