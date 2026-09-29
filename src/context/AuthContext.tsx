"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { homeFor, ROLE_LABELS, type Perm } from "@/lib/permissions";

interface Admin {
  /** WordPress user id — "my posts" in the staff area. */
  id?: number;
  name: string;
  email: string;
  /** Human label for the person's WordPress role, e.g. "Staff writer". */
  role: string;
  avatar: string;
  /** What the portal shows them. The server re-checks every request. */
  perms: Perm[];
  /** Signed in with a temporary password; must choose their own first. */
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
  /** After a successful password change: clear the flag and carry on. */
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
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

/**
 * A post-login destination from ?next=, accepted only if it stays inside the
 * portal. Anything else — another site, "//evil.example", "/\\host" — is
 * ignored, so a shared link can't be used to bounce staff somewhere hostile.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\/(staff|admin)(\/|\?|$)/.test(raw)) return null;
  if (/^\/\/|\\|^\/admin\/(login|set-password)/.test(raw)) return null;
  return raw;
}

/** Where the person who just signed in belongs — read after login(). */
export function homeAfterLogin(next?: string | null): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    if (stored.mustChangePassword) return SET_PASSWORD_PATH;
    const target = safeNext(next);
    // A staff-area link works for everyone; an admin link only for admins.
    if (target && (target.startsWith("/staff") || homeFor(stored.perms) === "/admin")) return target;
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
  
  // Use a mutable ref to hold the inactivity timeout ID across re-renders
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* 1. Restore the session, then confirm it — and the person's current
        permissions — with the server. A role an administrator changed since
        sign-in applies here; a session the server no longer accepts ends. */
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
          // Only a definite "not signed in" ends the session; a network blip
          // or server hiccup keeps the stored one.
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

  /* 2. Route guard for the portals. Signed-out visitors go to the login page;
        signed-in people go to the portal their permissions allow. */
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
    // A temporary password must be replaced before anything else. The server
    // refuses other requests meanwhile; this keeps the person on the one page
    // that works.
    if (admin?.mustChangePassword && (inAdmin || inStaff || isLoginPage)) {
      router.replace(SET_PASSWORD_PATH);
      return;
    }
    if (isSetPassword && admin && !admin.mustChangePassword) {
      router.replace(homeFor(admin.perms));
      return;
    }
    if (isLoginPage && admin && !admin.mustChangePassword) {
      // Already signed in and following a shared link: go straight there.
      const target = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(target && (target.startsWith("/staff") || homeFor(admin.perms) === "/admin") ? target : homeFor(admin.perms));
      return;
    }
    // Staff without console access who land on an /admin URL.
    if (inAdmin && admin && homeFor(admin.perms) === "/staff") {
      router.replace("/staff");
    }
  }, [admin, loading, pathname, router]);

  /* 3. Core logout mechanism */
  const logout = useCallback(() => {
    setAdmin(null);
    sessionStorage.removeItem(SESSION_KEY);
    
    // Clear out server token secure cookie asynchronously
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    
    // Clear any pending inactivity timeout if logging out manually
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    router.push("/admin/login");
  }, [router]);

  /* 4. Automated 1-Minute Inactivity Timer Loop */
  useEffect(() => {
    // Only set up listeners if an administrator is authenticated and logged in
    if (!admin) {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      return;
    }

    const resetTimer = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Schedule auto-logout after 1 minute of dead time
      activityTimeoutRef.current = setTimeout(() => {
        console.warn("Session expired: 1 minute of system inactivity reached.");
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Global system events that indicate user interaction
    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    // Register active listeners to keep resetting the 1-minute countdown clock
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Run the initial tracker setup immediately on mount
    resetTimer();

    // Cleanup: strip out window event tracking elements when context shifts or unmounts
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [admin, logout]);

  /* 5. Authentication handler accepting Username or Email strings universally */
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

      // Convert backend profile details cleanly into your UI's context layout structure
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
      
      return null; // Return null to flag successful execution chains
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