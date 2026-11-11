"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AppointmentModalProvider } from "../ui/AppointmentModalProvider";
import type { NewsletterIssue } from "@/lib/wp-newsletter";




export function AdminShellSuppressor({
  children,
  newsletter = null,
}: {
  children: React.ReactNode;
  newsletter?: NewsletterIssue | null;
}) {
  // only null on the static 500 page (src/pages), which never renders this
  const pathname = usePathname() ?? "";
  const isAdmin =
    pathname.startsWith("/admin") ||
    pathname === "/staff" || pathname.startsWith("/staff/") ||
    pathname === "/notices" || pathname.startsWith("/notices/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return(
    <AppointmentModalProvider>
      <Navbar />
      <main>{children}</main>
      <Footer newsletter={newsletter} />
    </AppointmentModalProvider>
  )
}
