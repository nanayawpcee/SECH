"use client";

import { AdminDataProvider } from "@/context/AdminDataContext";
import { PortalShell } from "@/components/admin/PortalShell";

/**
 * The staff area. Same design system as the admin console, its own
 * navigation, and only the data a staff member's permissions allow — the
 * shared data provider skips bookings, settings and comments for them.
 */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <PortalShell variant="staff">{children}</PortalShell>
    </AdminDataProvider>
  );
}
