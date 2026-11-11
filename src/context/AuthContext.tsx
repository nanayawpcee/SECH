"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { homeFor, ROLE_LABELS, type Perm } from "@/lib/permissions";

interface Admin {
  id?: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  perms: Perm[];
  mustChangePassword?: boolean;
}

export const SET_PASSWORD_PATH = "/admin/set-password";

function roleLabel(roles: string[] | undefined): string {
  const r = roles?.[0];
  return (r && ROLE_LABELS[r]?.label) || (r ? r[0].toUpperCase() + r.slice(1) : "Staff");
}

function initials(name: string) {
  return (name || "?").split(/\s+/).map((n) => n[0]).join("").toUpperCase().substring(0, 2);
}

interface AuthCtx {
  admin: Admin | null;
  passwordChanged: () => void;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  admin: null,
  passwordChanged: () => {},
  loading: true,
  login: async () => null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_KEY = "sech_admin_session";
const INACTIVITY_LIMIT = 5 * 60 * 1000;

// only allow ?next= paths inside the portal, never another site
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\/(staff|admin)(\/|\?|$)/.test(raw)) return null;
  if (/^\/\/|\\|^\/admin\/(login|set-password)/.test(raw)) return null;
  return raw;
}

export function homeAfterLogin(next?: string | null): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    if (stored.mustChangePassword) return SET_PASSWORD_PATH;
    const target = safeNext(next);
    if (target && (target.startsWith("/staff") || homeFor(stored.perms) !== "/staff")) return target;
    return homeFor(stored.perms);
  } catch {
    return "/staff";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let stored: Admin | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {}
    if (!stored) {
      setLoading(false);
      return;
    }
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          // only a real 401 signs out, a network blip keeps the session
          if (res.status === 401) {
            sessionStorage.removeItem(SESSION_KEY);
            setAdmin(null);
          } else {
            setAdmin({ ...stored!, perms: stored!.perms ?? [] });
          }
          return;
        }
        const data = await res.json();
        const fresh: Admin = {
          id: typeof data.user?.id === "number" ? data.user.id : stored!.id,
          name: data.user?.name || stored!.name,
          email: data.user?.email || stored!.email,
          role: roleLabel(data.user?.roles),
          avatar: initials(data.user?.name || stored!.name),
          perms: Array.isArray(data.perms) ? data.perms : [],
          mustChangePassword: data.mustChangePassword === true,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
        setAdmin(fresh);
      })
      .catch(() => setAdmin({ ...stored!, perms: stored!.perms ?? [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const isLoginPage = pathname === "/admin/login";
    const isSetPassword = pathname === SET_PASSWORD_PATH;
    const inAdmin = pathname.startsWith("/admin") && !isLoginPage && !isSetPassword;
    const inStaff = pathname === "/staff" || pathname.startsWith("/staff/");

    if ((inAdmin || inStaff || isSetPassword) && !admin) {
      router.replace("/admin/login");
      return;
    }
    // temporary password: keep them on the set-password page
    if (admin?.mustChangePassword && (inAdmin || inStaff || isLoginPage)) {
      router.replace(SET_PASSWORD_PATH);
      return;
    }
    if (isSetPassword && admin && !admin.mustChangePassword) {
      router.replace(homeFor(admin.perms));
      return;
    }
    if (isLoginPage && admin && !admin.mustChangePassword) {
      const target = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(target && (target.startsWith("/staff") || homeFor(admin.perms) !== "/staff") ? target : homeFor(admin.perms));
      return;
    }
    if (inAdmin && admin && homeFor(admin.perms) === "/staff") {
      router.replace("/staff");
    }
  }, [admin, loading, pathname, router]);

  const logout = useCallback(() => {
    setAdmin(null);
    sessionStorage.removeItem(SESSION_KEY);
    
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    if (!admin) {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      return;
    }

    const resetTimer = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        console.warn("Session expired: 1 minute of system inactivity reached.");
        logout();
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [admin, logout]);

  const login = useCallback(async (identifier: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return data.error || "Invalid credentials. Please try again.";
      }

      const adminUser: Admin = {
        id: typeof data.user?.databaseId === "number" ? data.user.databaseId : undefined,
        name: data.user?.name || "Staff member",
        email: data.user?.email || (identifier.includes("@") ? identifier.trim() : ""),
        role: roleLabel(data.user?.roles),
        avatar: initials(data.user?.name || ""),
        perms: Array.isArray(data.perms) ? data.perms : [],
        mustChangePassword: data.mustChangePassword === true,
      };

      setAdmin(adminUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      
      return null;
    } catch (err) {
      return "A network error occurred. Please check your connection and try again.";
    }
  }, []);

  const passwordChanged = useCallback(() => {
    setAdmin((prev) => {
      if (!prev) return prev;
      const next = { ...prev, mustChangePassword: false };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, passwordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}