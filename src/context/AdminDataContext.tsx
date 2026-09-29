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
import type { AdminPost } from "@/lib/wp-posts";
import type { AdminBooking } from "@/lib/wp-bookings";
import { EMPTY_SETTINGS, type HospitalSettings } from "@/lib/wp-settings";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import type { StaffNotice } from "@/lib/wp-notices";

/** Viewport width at which the admin console is treated as a laptop rather than
 *  a tablet. 1024px is the conventional divide — iPad portrait (768) and most
 *  tablets fall below it, laptops at or above. */
const LAPTOP_MIN_WIDTH = 1024;

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

  /** Includes featured image and comment settings from WordPress. */
  posts: AdminPost[];
  postsLoading: boolean;
  postsError: string | null;
  refreshPosts: () => Promise<void>;
  /** Resolves with the post as WordPress actually stored it — which may
   *  differ from the request, e.g. a writer's "publish" becomes "pending". */
  updatePost: (id: number, patch: Partial<Post>) => Promise<AdminPost>;
  deletePost: (id: number) => Promise<void>;
  togglePostStatus: (id: number) => Promise<void>;

  bookings: AdminBooking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  refreshBookings: () => Promise<void>;
  confirmBooking: (databaseId: number) => Promise<void>;
  cancelBooking: (databaseId: number) => Promise<void>;

  /** Staff notice board — every signed-in person. */
  notices: StaffNotice[];
  noticesLoading: boolean;
  /** WordPress doesn't have plugin 1.1.0 yet, so the board can't load. */
  noticesNeedPlugin: boolean;
  refreshNotices: () => Promise<void>;
  markNoticeRead: (id: number) => Promise<void>;
  /** Create (no id) or update. Returns the saved notice, or null on failure. */
  saveNotice: (input: Partial<StaffNotice> & { title: string; resetReads?: boolean }, id?: number) => Promise<StaffNotice | null>;
  deleteNotice: (id: number) => Promise<boolean>;

  /** Comments awaiting moderation — drives the nav badge and the bell. */
  pendingComments: number;
  refreshPendingComments: () => Promise<void>;

  /** Hospital profile + booking config, persisted in WordPress. */
  settings: HospitalSettings;
  settingsLoading: boolean;
  settingsError: string | null;
  settingsDirty: boolean;
  /** Edits locally; nothing is written until saveSettings() runs. */
  patchSettings: (patch: Partial<HospitalSettings>) => void;
  saveSettings: () => Promise<void>;
  /** Reload from WordPress — also how unsaved edits are discarded. */
  refreshSettings: () => Promise<void>;
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
  const { logout, admin } = useAuth();
  // Only load what this person may see. Staff never request patient bookings
  // or settings at all — the server would refuse, but not asking is better.
  const canPosts = can(admin?.perms, "posts.write");
  const canBookings = can(admin?.perms, "bookings");
  const canSettings = can(admin?.perms, "settings");
  const canComments = can(admin?.perms, "comments");
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  /** A 401 means WordPress no longer accepts the session: sign out cleanly
   *  rather than leave the console showing stale data and error banners. */
  const expired = (res: Response) => {
    if (res.status !== 401) return false;
    logoutRef.current();
    return true;
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [posts, setPosts] = useState<AdminPost[]>([]);
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
  const [pendingComments, setPendingComments] = useState(0);
  const [notices, setNotices] = useState<StaffNotice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesNeedPlugin, setNoticesNeedPlugin] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [poppingToast, setPoppingToast] = useState<Toast | null>(null);
  const [toastPanelOpen, setToastPanelOpen] = useState(false);
  const [editorDirty, setEditorDirtyState] = useState(false);
  const [guardTarget, setGuardTarget] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  /* ── Responsive sidebar ──
   * Tablets and below get the icon rail; laptops and up get the full sidebar.
   * Driven by matchMedia rather than a resize handler so it only fires when the
   * viewport actually crosses the breakpoint — a manual toggle therefore sticks
   * for as long as the user stays in that size class, instead of being undone
   * by every stray resize event. */
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LAPTOP_MIN_WIDTH - 0.02}px)`);
    setSidebarCollapsed(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
      if (expired(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load posts.");
      setPosts(data.posts as AdminPost[]);
      setPostsError(null);
    } catch (err: any) {
      setPostsError(err?.message ?? "Could not load posts.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canPosts) refreshPosts();
    else setPostsLoading(false);
  }, [canPosts, refreshPosts]);

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
        setPosts((prev) => prev.map((p) => (p.id === id ? (data.post as AdminPost) : p)));
        return data.post as AdminPost;
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
      if (expired(res)) return;
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
    if (canBookings) refreshBookings();
    else setBookingsLoading(false);
  }, [canBookings, refreshBookings]);

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

  /* ── Staff notice board ── */
  const signedIn = !!admin;
  const refreshNotices = useCallback(async () => {
    try {
      const res = await fetch("/api/notices");
      if (expired(res)) return;
      const data = await res.json();
      if (!res.ok) return;
      setNotices(Array.isArray(data.notices) ? data.notices : []);
      setNoticesNeedPlugin(!!data.needsPlugin);
    } catch {
      /* keep what we have */
    } finally {
      setNoticesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (signedIn) refreshNotices();
    else setNoticesLoading(false);
  }, [signedIn, refreshNotices]);

  const markNoticeRead = useCallback(async (id: number) => {
    // Optimistic: the unread dot clears at once.
    setNotices((list) => list.map((n) => (n.databaseId === id ? { ...n, isRead: true } : n)));
    try {
      const res = await fetch(`/api/notices/${id}/read`, { method: "POST" });
      if (expired(res)) return;
      const data = await res.json();
      if (res.ok && data.notice) {
        setNotices((list) => list.map((n) => (n.databaseId === id ? data.notice : n)));
      } else {
        setNotices((list) => list.map((n) => (n.databaseId === id ? { ...n, isRead: false } : n)));
      }
    } catch {
      setNotices((list) => list.map((n) => (n.databaseId === id ? { ...n, isRead: false } : n)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveNotice = useCallback(
    async (input: Partial<StaffNotice> & { title: string; resetReads?: boolean }, id?: number) => {
      try {
        const res = await fetch(id ? `/api/notices/${id}` : "/api/notices", {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (expired(res)) return null;
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not save the notice.");
        await refreshNotices(); // re-sort: pinned, then newest
        addToast(id ? "Notice updated" : "Notice posted to the board");
        return data.notice as StaffNotice;
      } catch (err: any) {
        addToast(err?.message ?? "Could not save the notice.", "danger");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshNotices, addToast],
  );

  const deleteNotice = useCallback(
    async (id: number) => {
      const previous = notices;
      setNotices((list) => list.filter((n) => n.databaseId !== id));
      try {
        const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
        if (expired(res)) return false;
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not remove the notice.");
        addToast("Notice removed", "danger");
        return true;
      } catch (err: any) {
        setNotices(previous);
        addToast(err?.message ?? "Could not remove the notice.", "danger");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notices, addToast],
  );

  /* ── Comment moderation count ── */
  const refreshPendingComments = useCallback(async () => {
    try {
      const res = await fetch("/api/comments/pending");
      if (expired(res) || !res.ok) return; // A badge is not worth an error toast.
      const data = await res.json();
      setPendingComments(
        typeof data.total === "number" ? data.total : Array.isArray(data.comments) ? data.comments.length : 0,
      );
    } catch {
      // Leave the last known count in place.
    }
  }, []);

  useEffect(() => {
    if (canComments) refreshPendingComments();
  }, [canComments, refreshPendingComments]);

  /* ── Hospital settings ── */
  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (expired(res)) return;
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
    if (canSettings) refreshSettings();
    else setSettingsLoading(false);
  }, [canSettings, refreshSettings]);

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
        pendingComments,
        refreshPendingComments,
        notices,
        noticesLoading,
        noticesNeedPlugin,
        refreshNotices,
        markNoticeRead,
        saveNotice,
        deleteNotice,
        settings,
        settingsLoading,
        settingsError,
        settingsDirty,
        patchSettings,
        saveSettings,
        refreshSettings,
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
