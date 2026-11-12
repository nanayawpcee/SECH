"use client";

import "@/styles/admin.css";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { PortalShell } from "@/components/admin/PortalShell";
import { adminFont } from "./fonts";

// pages without the portal around them, open to anyone
const BARE_PAGES = ["/admin/login", "/admin/set-password", "/admin/forgot-password", "/admin/reset-password"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // only null on the static 500 page (src/pages), which never renders this
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (BARE_PAGES.includes(pathname)) document.documentElement.removeAttribute("data-admin-theme");
  }, [pathname]);

  if (BARE_PAGES.includes(pathname)) {
    return <div className={adminFont.variable}>{children}</div>;
  }

  return (
    <AdminDataProvider>
      <PortalShell variant="admin">{children}</PortalShell>
    </AdminDataProvider>
  );
}
