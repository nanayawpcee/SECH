"use client";

import { AdminDataProvider } from "@/context/AdminDataContext";
import { PortalShell } from "@/components/admin/PortalShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <PortalShell variant="staff">{children}</PortalShell>
    </AdminDataProvider>
  );
}
