"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import posthog from "posthog-js";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthCtx {
  admin: Admin | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  admin: null,
  loading: true,
  login: async () => null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_KEY = "sech_admin_session";
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 1 minute in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use a mutable ref to hold the inactivity timeout ID across re-renders
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* 1. Restore session from sessionStorage on mount */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const restoredAdmin = JSON.parse(stored) as Admin;
        setAdmin(restoredAdmin);

        if (restoredAdmin.id && posthog.__loaded) {
          posthog.identify(restoredAdmin.id, {
            email: restoredAdmin.email,
            name: restoredAdmin.name,
            role: restoredAdmin.role,
          });
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  /* 2. Redirect unauthenticated users away from /admin/* (except /admin/login) */
  useEffect(() => {
    if (loading) return;
    const isAdminRoute = pathname.startsWith("/admin");
    const isLoginPage = pathname === "/admin/login";
    
    if (isAdminRoute && !isLoginPage && !admin) {
      router.replace("/admin/login");
    }
    if (isLoginPage && admin) {
      router.replace("/admin");
    }
  }, [admin, loading, pathname, router]);

  /* 3. Core logout mechanism */
  const logout = useCallback(() => {
    if (posthog.__loaded) {
      posthog.capture("admin_logged_out");
      posthog.reset();
    }
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

      const adminId = data.user?.id;
      if (typeof adminId !== "string" || !adminId) {
        return "Your account could not be identified. Please try again.";
      }

      // Convert backend profile details cleanly into your UI's context layout structure
      const adminUser: Admin = {
        id: adminId,
        name: data.user?.name || "Admin User",
        email: data.user?.email || (identifier.includes("@") ? identifier.trim() : ""),
        role: "Super Admin", 
        avatar: (data.user?.name || "AU")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2),
      };

      setAdmin(adminUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));

      if (posthog.__loaded) {
        posthog.identify(adminUser.id, {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        });
        posthog.capture("admin_logged_in");
      }
      
      return null; // Return null to flag successful execution chains
    } catch (err) {
      return "A network error occurred. Please check your connection and try again.";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}