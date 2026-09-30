"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { indexSetup, type Employee, type PortalUserOption, type StaffRanks, type StaffSetup, type StaffStructure } from "@/lib/staff";

type SaveResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Loads staff records and the structure they hang off, for the three staff
 * pages. Each page mounts its own copy; the data is small and a fresh read
 * after navigating keeps two HR officers from overwriting each other's work
 * with a stale list.
 */
export function useStaff() {
  const { logout } = useAuth();
  const [setup, setSetup] = useState<StaffSetup | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [portalUsers, setPortalUsers] = useState<PortalUserOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<SaveResult<T>> => {
      try {
        const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
        if (res.status === 401) {
          logout();
          return { ok: false, error: "Your session has expired." };
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error || "Something went wrong." };
        return { ok: true, value: data as T };
      } catch {
        return { ok: false, error: "Couldn’t reach the server. Check the connection." };
      }
    },
    [logout],
  );

  const reload = useCallback(async () => {
    const r = await request<{ setup: StaffSetup | null; employees: Employee[]; portalUsers: PortalUserOption[]; needsPlugin?: boolean }>("/api/staff");
    if (r.ok) {
      setSetup(r.value.setup);
      setEmployees(r.value.employees);
      setPortalUsers(r.value.portalUsers);
      setNeedsPlugin(!!r.value.needsPlugin);
      setError("");
    } else {
      setError(r.error);
    }
    setLoaded(true);
  }, [request]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveEmployee = useCallback(
    async (input: Partial<Employee>, id?: number): Promise<SaveResult<Employee>> => {
      const r = await request<{ employee: Employee }>(id ? `/api/staff/${id}` : "/api/staff", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(input),
      });
      if (!r.ok) return r;
      const saved = r.value.employee;
      setEmployees((list) => {
        const rest = list.filter((e) => e.databaseId !== saved.databaseId);
        return [...rest, saved].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      });
      return { ok: true, value: saved };
    },
    [request],
  );

  const deleteEmployee = useCallback(
    async (id: number): Promise<SaveResult<true>> => {
      const r = await request<{ ok: boolean }>(`/api/staff/${id}`, { method: "DELETE" });
      if (!r.ok) return r;
      setEmployees((list) => list.filter((e) => e.databaseId !== id));
      // The plugin clears them from any in-charge slot; mirror that locally.
      setSetup((s) =>
        s && {
          ...s,
          structure: {
            departments: s.structure.departments.map((d) => ({
              ...d,
              inchargeId: d.inchargeId === id ? 0 : d.inchargeId,
              units: d.units.map((u) => ({
                ...u,
                inchargeId: u.inchargeId === id ? 0 : u.inchargeId,
                deputyId: u.deputyId === id ? 0 : u.deputyId,
              })),
            })),
          },
        },
      );
      return { ok: true, value: true };
    },
    [request],
  );

  const saveStructure = useCallback(
    async (structure: StaffStructure): Promise<SaveResult<StaffStructure>> => {
      const r = await request<{ data: StaffStructure }>("/api/staff/setup", {
        method: "PUT",
        body: JSON.stringify({ kind: "structure", data: structure }),
      });
      if (!r.ok) return r;
      setSetup((s) => s && { ...s, structure: r.value.data });
      return { ok: true, value: r.value.data };
    },
    [request],
  );

  const saveRanks = useCallback(
    async (ranks: StaffRanks): Promise<SaveResult<StaffRanks>> => {
      const r = await request<{ data: StaffRanks }>("/api/staff/setup", {
        method: "PUT",
        body: JSON.stringify({ kind: "ranks", data: ranks }),
      });
      if (!r.ok) return r;
      setSetup((s) => s && { ...s, ranks: r.value.data });
      return { ok: true, value: r.value.data };
    },
    [request],
  );

  const index = useMemo(() => indexSetup(setup), [setup]);

  return {
    setup, employees, portalUsers, loaded, needsPlugin, error, index,
    reload, saveEmployee, deleteEmployee, saveStructure, saveRanks,
  };
}
