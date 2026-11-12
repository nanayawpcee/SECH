"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/admin/ui";
import { SITE } from "@/lib/data";
import { amountInWords, categoryLabel, detailRows, formatMoney, maskGhanaCard, type AccTransaction } from "@/lib/accounts";

// 80mm thermal slip. only the slip prints, nothing else on the page
const PRINT_CSS = `
.rc-wrap { display: flex; justify-content: center; padding: 8px 0 40px; }
.rc-slip { width: 80mm; background: #fff; color: #000; padding: 4mm 4mm 6mm; box-shadow: 0 6px 24px rgba(0,0,0,.12);
  font: 12px/1.35 Arial, Helvetica, sans-serif; position: relative; }
.rc-center { text-align: center; }
.rc-name { font-weight: 800; font-size: 13px; letter-spacing: .02em; margin-top: 2mm; }
.rc-small { font-size: 10.5px; }
.rc-title { margin: 3mm 0 2mm; padding: 1.5mm 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000;
  font-weight: 800; font-size: 13px; letter-spacing: .12em; text-align: center; }
.rc-row { display: flex; justify-content: space-between; gap: 3mm; margin: 1mm 0; }
.rc-row span:first-child { color: #000; white-space: nowrap; }
.rc-row span:last-child { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.rc-amount { margin: 3mm 0 1mm; padding: 2mm 0; border-top: 1px solid #000; border-bottom: 1px solid #000;
  display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; }
.rc-words { font-style: italic; font-size: 11px; margin-bottom: 2mm; }
.rc-sign { margin-top: 7mm; display: flex; justify-content: space-between; gap: 4mm; font-size: 10.5px; }
.rc-sign div { flex: 1; border-top: 1px solid #000; padding-top: 1mm; text-align: center; }
.rc-void { position: absolute; inset: 35% 0 auto; text-align: center; font-size: 34px; font-weight: 900; letter-spacing: .2em;
  color: rgba(0,0,0,.25); transform: rotate(-18deg); pointer-events: none; }
.rc-copy { text-align: center; font-weight: 800; font-size: 11px; margin-top: 1mm; }
@media print {
  @page { size: 80mm auto; margin: 0; }
  body * { visibility: hidden !important; }
  .rc-slip, .rc-slip * { visibility: visible !important; }
  .rc-slip { position: fixed; left: 0; top: 0; box-shadow: none; }
}
`;

export default function ReceiptPage() {
  // client page: Next 16 hands pages their params as a promise, the hook reads them directly
  const params = { id: String(useParams()?.id ?? "") };
  const { logout } = useAuth();
  const search = useSearchParams();
  const [t, setT] = useState<AccTransaction | null>(null);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const [copyNo, setCopyNo] = useState(0);
  const autoPrinted = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/accounts/transactions/${params.id}`, { cache: "no-store" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Could not load the receipt.");
      setT(data.transaction);
    })();
  }, [params.id, logout]);

  const print = useCallback(async () => {
    if (!t) return;
    setPrinting(true);
    // every print is logged; anything after the first is marked as a copy
    const res = await fetch(`/api/accounts/transactions/${t.databaseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "print" }),
    });
    const data = await res.json().catch(() => ({}));
    setPrinting(false);
    if (!res.ok) return setError(data.error || "Could not log the print. Try again.");
    setCopyNo(data.printCount > 1 ? data.printCount : 0);
    setTimeout(() => window.print(), 150);
  }, [t]);

  useEffect(() => {
    if (t && search?.get("print") === "1" && !autoPrinted.current && t.printCount === 0) {
      autoPrinted.current = true;
      print();
    }
  }, [t, search, print]);

  const out = t?.direction === "out";

  return (
    <>
      <style>{PRINT_CSS}</style>
      <PageHeader
        title={t ? t.receiptNo : "Receipt"}
        subtitle={t ? `${categoryLabel(t.category)}, ${formatMoney(t.amount)}` : "Loading…"}
        actions={
          <>
            <Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>
            <button type="button" className="po-btn po-btn--primary" onClick={print} disabled={!t || printing}>
              {printing ? <Loader2 size={15} className="po-spin" /> : <Printer size={15} />}
              {t && t.printCount > 0 ? "Print a copy" : "Print"}
            </button>
          </>
        }
      />

      {error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{error}</span>
        </div>
      )}
      {t && t.printCount > 0 && (
        <p className="po-hint" style={{ textAlign: "center" }}>Printed {t.printCount} time{t.printCount === 1 ? "" : "s"}. Further prints are marked as copies.</p>
      )}

      {t && (
        <div className="rc-wrap">
          <div className="rc-slip">
            {t.status === "voided" && <div className="rc-void">VOID</div>}
            <div className="rc-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="" width={46} height={46} style={{ display: "inline-block" }} />
              <div className="rc-name">ST. ELIZABETH CATHOLIC HOSPITAL</div>
              <div className="rc-small">Hwidiem, Ahafo Region</div>
              <div className="rc-small">Tel: {SITE.phone}</div>
            </div>
            <div className="rc-title">{out ? "PAYMENT VOUCHER" : "OFFICIAL RECEIPT"}</div>
            {copyNo > 0 && <div className="rc-copy">COPY {copyNo}</div>}

            <div className="rc-row"><span>No.</span><span>{t.receiptNo}</span></div>
            <div className="rc-row"><span>Date</span><span>{new Date(t.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div className="rc-row"><span>{out ? "Paid to" : "Received from"}</span><span>{t.party}</span></div>
            {t.department && <div className="rc-row"><span>Dept/unit</span><span>{t.department}</span></div>}
            {/* only part of the card number goes on paper */}
            {t.ghanaCard && <div className="rc-row"><span>Ghana Card</span><span>{maskGhanaCard(t.ghanaCard)}</span></div>}
            {t.phone && <div className="rc-row"><span>Phone</span><span>{t.phone}</span></div>}
            <div className="rc-row"><span>{out ? "Being" : "For"}</span><span>{categoryLabel(t.category)}</span></div>
            {detailRows(t).map(([k, v]) => <div key={k} className="rc-row"><span>{k}</span><span>{v}</span></div>)}
            {t.description && <div className="rc-row"><span>Note</span><span>{t.description}</span></div>}

            <div className="rc-amount"><span>{out ? "PAID" : "AMOUNT"}</span><span>{formatMoney(t.amount)}</span></div>
            <div className="rc-words">{amountInWords(t.amount)}</div>
            <div className="rc-row"><span>Method</span><span>Cash</span></div>
            <div className="rc-row"><span>Cashier</span><span>{t.cashier}</span></div>
            {t.status === "voided" && (
              <div className="rc-row"><span>Voided</span><span>{t.voidReason}</span></div>
            )}

            <div className="rc-sign">
              <div>Cashier</div>
              <div>{out ? "Received by" : "Payer"}</div>
            </div>
            <div className="rc-center rc-small" style={{ marginTop: "4mm" }}>
              {out ? "Keep this voucher with the accounts records." : "Thank you. Please keep this receipt."}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
