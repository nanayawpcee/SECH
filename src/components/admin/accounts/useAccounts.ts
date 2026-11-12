"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AccAdvance, AccDepartment, AccHousingType, AccTenancy, AccTransaction } from "@/lib/accounts";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function useAccounts(range: { from: string; to: string }) {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<AccTransaction[]>([]);
  const [advances, setAdvances] = useState<AccAdvance[]>([]);
  const [tenancies, setTenancies] = useState<AccTenancy[]>([]);
  const [housingTypes, setHousingTypes] = useState<AccHousingType[]>([]);
  const [departments, setDepartments] = useState<AccDepartment[]>([]);
  const [canAudit, setCanAudit] = useState(false);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<Result<T>> => {
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
    const r = await request<{
      transactions: AccTransaction[]; advances: AccAdvance[]; tenancies: AccTenancy[];
      housingTypes: AccHousingType[]; departments: AccDepartment[]; canAudit?: boolean; needsPlugin?: boolean;
    }>(`/api/accounts?from=${range.from}&to=${range.to}`);
    if (r.ok) {
      setTransactions(r.value.transactions);
      setAdvances(r.value.advances);
      setTenancies(r.value.tenancies);
      setHousingTypes(r.value.housingTypes);
      setDepartments(r.value.departments ?? []);
      setCanAudit(!!r.value.canAudit);
      setNeedsPlugin(!!r.value.needsPlugin);
      setError("");
    } else {
      setError(r.error);
    }
    setLoaded(true);
  }, [request, range.from, range.to]);

  useEffect(() => { reload(); }, [reload]);

  const record = useCallback(async (input: Record<string, unknown>): Promise<Result<AccTransaction>> => {
    const r = await request<{ transaction: AccTransaction }>("/api/accounts/transactions", { method: "POST", body: JSON.stringify(input) });
    if (!r.ok) return r;
    await reload();
    return { ok: true, value: r.value.transaction };
  }, [request, reload]);

  const voidTxn = useCallback(async (id: number, reason: string): Promise<Result<AccTransaction>> => {
    const r = await request<{ transaction: AccTransaction }>(`/api/accounts/transactions/${id}`, { method: "PATCH", body: JSON.stringify({ action: "void", reason }) });
    if (!r.ok) return r;
    await reload();
    return { ok: true, value: r.value.transaction };
  }, [request, reload]);

  const saveTenancy = useCallback(async (input: Record<string, unknown>): Promise<Result<AccTenancy>> => {
    const r = await request<{ tenancy: AccTenancy }>("/api/accounts/tenancies", { method: "POST", body: JSON.stringify(input) });
    if (!r.ok) return r;
    await reload();
    return { ok: true, value: r.value.tenancy };
  }, [request, reload]);

  const saveHousingTypes = useCallback(async (types: AccHousingType[]): Promise<Result<AccHousingType[]>> => {
    const r = await request<{ types: AccHousingType[] }>("/api/accounts/housing-types", { method: "PUT", body: JSON.stringify({ types }) });
    if (!r.ok) return r;
    setHousingTypes(r.value.types);
    return { ok: true, value: r.value.types };
  }, [request]);

  const logExport = useCallback(
    (count: number, rangeLabel: string) =>
      request<{ ok: boolean }>("/api/accounts/export-log", { method: "POST", body: JSON.stringify({ count, range: rangeLabel }) }),
    [request],
  );

  return {
    transactions, advances, tenancies, housingTypes, departments, canAudit, needsPlugin, loaded, error,
    reload, record, voidTxn, saveTenancy, saveHousingTypes, logExport,
  };
}

export type AccountsData = ReturnType<typeof useAccounts>;

/** YYYY-MM-DD in local time */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
