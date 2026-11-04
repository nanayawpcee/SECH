"use client";

import "@/styles/admin.css";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { PortalShell } from "@/components/admin/PortalShell";
import { adminFont } from "./fonts";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/set-password") document.documentElement.removeAttribute("data-admin-theme");
  }, [pathname]);

  if (pathname === "/admin/login" || pathname === "/admin/set-password") {
    return <div className={adminFont.variable}>{children}</div>;
  }

  return (
    <AdminDataProvider>
      <PortalShell variant="admin">{children}</PortalShell>
    </AdminDataProvider>
  );
}
