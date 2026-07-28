"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SAMPLE_POSTS, SAMPLE_BOOKINGS, type Post, type Booking } from "@/app/admin/data";

export type ToastKind = "success" | "warn" | "danger";

export interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

export function toastDotColor(kind: ToastKind): string {
  return kind === "danger" ? "#DC2626" : kind === "warn" ? "#d97706" : "#16a34a";
}

const DEFAULT_DEPARTMENTS = [
  "General Medicine",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "Surgery",
  "Eye Center (Ophthalmology)",
  "Dental",
  "Psychiatry & Counselling",
  "Ante-Natal Clinic",
  "Physiotherapy",
  "Nutrition & Dietetics",
];

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
  addPost: (post: Post) => void;
  updatePost: (id: number, patch: Partial<Post>) => void;
  deletePost: (id: number) => void;
  togglePostStatus: (id: number) => void;

  bookings: Booking[];
  confirmBooking: (id: string) => void;
  cancelBooking: (id: string) => void;

  depts: string[];
  addDept: (d: string) => void;
  removeDept: (d: string) => void;

  notifs: NotifSettings;
  toggleNotif: (key: keyof NotifSettings) => void;

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
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS);
  const [depts, setDepts] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [notifs, setNotifs] = useState<NotifSettings>({
    email: true,
    sms: false,
    newBooking: true,
    cancellation: true,
    daily: false,
  });
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

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);
  const updatePost = useCallback((id: number, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);
  const deletePost = useCallback(
    (id: number) => {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast("Post deleted", "danger");
    },
    [addToast],
  );
  const togglePostStatus = useCallback(
    (id: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: p.status === "published" ? "draft" : "published" }
            : p,
        ),
      );
      addToast("Post status updated");
    },
    [addToast],
  );

  const confirmBooking = useCallback(
    (id: string) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "confirmed" as const } : b)),
      );
      addToast("Booking confirmed");
    },
    [addToast],
  );
  const cancelBooking = useCallback(
    (id: string) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)),
      );
      addToast("Booking cancelled", "danger");
    },
    [addToast],
  );

  const addDept = useCallback(
    (d: string) => {
      const v = d.trim();
      if (!v) return;
      setDepts((prev) => (prev.includes(v) ? prev : [...prev, v]));
      addToast("Department added");
    },
    [addToast],
  );
  const removeDept = useCallback(
    (d: string) => {
      setDepts((prev) => prev.filter((x) => x !== d));
      addToast("Department removed", "danger");
    },
    [addToast],
  );

  const toggleNotif = useCallback((key: keyof NotifSettings) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
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
        addPost,
        updatePost,
        deletePost,
        togglePostStatus,
        bookings,
        confirmBooking,
        cancelBooking,
        depts,
        addDept,
        removeDept,
        notifs,
        toggleNotif,
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
