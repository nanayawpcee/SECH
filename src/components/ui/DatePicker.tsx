"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import "@/styles/datepicker.css";

/*
 * Date and month pickers in place of the browser's, for the portal and the
 * public booking forms. Inside the portal they take its colours and dark
 * mode; elsewhere the website's.
 * Values are plain strings, the same as <input type="date|month">:
 * "2026-11-14" for a day, "2026-11" for a month, "" for none.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (y: number, m: number) => `${y}-${pad(m + 1)}`;
const parseDay = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const parseMonth = (v: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1 } : null;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonthsTo = (d: Date, n: number) => {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
};

export const formatDay = (v: string) => {
  const d = parseDay(v);
  return d ? `${d.getDate()} ${SHORT[d.getMonth()]} ${d.getFullYear()}` : "";
};
export const formatMonth = (v: string) => {
  const p = parseMonth(v);
  return p ? `${MONTHS[p.m]} ${p.y}` : "";
};

/* ── Shared shell: the trigger and a popover kept on screen ─────────────── */

function usePopover() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const t = triggerRef.current;
    const p = popRef.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    const below = r.bottom + 6;
    const top = below + h > window.innerHeight - 8 && r.top - h - 6 > 8 ? r.top - h - 6 : Math.min(below, window.innerHeight - h - 8);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const next = { top: Math.max(8, Math.round(top)), left: Math.round(left) };
    setPos((prev) => (prev && prev.top === next.top && prev.left === next.left ? prev : next));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!popRef.current?.contains(n) && !triggerRef.current?.contains(n)) setOpen(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  // the popover goes inside the portal's root, so its colours and dark mode carry over,
  // and a scrolling drawer can't clip it
  const [host, setHost] = useState<Element | null>(null);
  const show = useCallback(() => {
    setHost(triggerRef.current?.closest(".po-root") ?? document.body);
    setOpen(true);
  }, []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setPos(null);
    if (refocus) triggerRef.current?.focus();
  }, []);

  return { open, show, close, triggerRef, popRef, pos, place, host };
}

function Shell({
  label, placeholder, ariaLabel, disabled, clearable, onClear, onOpen, pop, children, id, inputClassName, invalid,
}: {
  label: string;
  inputClassName: string;
  invalid?: boolean;
  placeholder: string;
  ariaLabel?: string;
  disabled?: boolean;
  clearable: boolean;
  onClear: () => void;
  /** reset the view each time it opens */
  onOpen: () => void;
  pop: ReturnType<typeof usePopover>;
  children: ReactNode;
  id?: string;
}) {
  const { open, close, triggerRef, popRef, pos, host } = pop;
  const show = () => { onOpen(); pop.show(); };
  // hidden until measured, so it never flashes in the wrong place
  const style = pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: "hidden" as const };
  return (
    <div className="dtp">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`${inputClassName} dtp-trigger`}
        aria-haspopup="dialog"
        data-invalid={invalid || undefined}
        aria-expanded={open}
        aria-label={ariaLabel ? `${ariaLabel}${label ? `: ${label}` : ""}` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); show(); } }}
      >
        <CalendarDays size={15} className="dtp-icon" />
        <span className={label ? "dtp-value" : "dtp-placeholder"}>{label || placeholder}</span>
      </button>
      {clearable && label && !disabled && (
        <button type="button" className="dtp-clear" aria-label={`Clear ${ariaLabel ?? "date"}`} onClick={onClear}>
          <X size={13} />
        </button>
      )}
      {open && host && createPortal(
        <div
          ref={popRef}
          className="dtp-pop"
          role="dialog"
          aria-label={ariaLabel ?? "Choose a date"}
          style={style}
          // only the picker closes, not a modal or drawer it sits in
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }}
        >
          {children}
        </div>,
        host,
      )}
    </div>
  );
}


function Head({ title, onTitle, onPrev, onNext, prevLabel, nextLabel, prevDisabled, nextDisabled }: {
  title: string; onTitle?: () => void; onPrev: () => void; onNext: () => void;
  prevLabel: string; nextLabel: string; prevDisabled?: boolean; nextDisabled?: boolean;
}) {
  return (
    <div className="dtp-head">
      <button type="button" className="dtp-nav" onClick={onPrev} aria-label={prevLabel} disabled={prevDisabled}><ChevronLeft size={16} /></button>
      {onTitle
        ? <button type="button" className="dtp-title" onClick={onTitle}>{title}</button>
        : <span className="dtp-title dtp-title--static">{title}</span>}
      <button type="button" className="dtp-nav" onClick={onNext} aria-label={nextLabel} disabled={nextDisabled}><ChevronRight size={16} /></button>
    </div>
  );
}

/** months or years laid out 3 across, for jumping a long way quickly */
function Tiles({ items, onPick }: {
  items: { key: string; label: string; selected?: boolean; current?: boolean; disabled?: boolean }[];
  onPick: (key: string) => void;
}) {
  return (
    <div className="dtp-tiles">
      {items.map((it) => (
        <button key={it.key} type="button" className="dtp-tile" disabled={it.disabled}
          data-selected={it.selected || undefined} data-current={it.current || undefined}
          aria-pressed={it.selected} onClick={() => onPick(it.key)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

interface PickerProps {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  /** "po-input" in the portal, "form-input" on the website */
  inputClassName?: string;
  invalid?: boolean;
}

const yearPage = (y: number) => y - (((y % 12) + 12) % 12);

/* ── Day picker ─────────────────────────────────────────────────────────── */

export function DatePicker({
  value, onChange, min, max, placeholder = "Choose a date", ariaLabel, disabled, clearable = true, id,
  inputClassName = "po-input", invalid, startWith = "days",
}: PickerProps & {
  /** "years" for a date of birth, so nobody has to page back month by month */
  startWith?: "days" | "years";
}) {
  const pop = usePopover();
  const today = dayKey(new Date());
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [focus, setFocus] = useState<Date>(() => parseDay(value) ?? new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const out = (k: string) => (!!min && k < min) || (!!max && k > max);

  // opening starts on the chosen day, or today, or the nearest allowed day
  const onOpen = () => {
    const start = value || (out(today) ? (min && today < min ? min : max ?? today) : today);
    setFocus(parseDay(start) ?? new Date());
    setView(value ? "days" : startWith);
  };

  // focus moves in once the popover is placed and visible
  const { place } = pop;
  const shown = pop.open && !!pop.pos;
  const { popRef } = pop;
  useEffect(() => {
    if (!shown) return;
    if (view === "days") gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(focus)}"]`)?.focus();
    else popRef.current?.querySelector<HTMLButtonElement>(".dtp-tile[data-selected], .dtp-tile[data-current], .dtp-tile:not(:disabled)")?.focus();
    place();
  }, [focus, view, shown, place, popRef]);

  const pick = (k: string) => {
    if (out(k)) return;
    onChange(k);
    pop.close();
  };

  const y = focus.getFullYear();
  const m = focus.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(y, m, i - lead + 1));

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonthsTo(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonthsTo(focus, e.shiftKey ? 12 : 1),
      Home: () => addDays(focus, -((focus.getDay() + 6) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() + 6) % 7)),
    };
    if (moves[e.key]) { e.preventDefault(); setFocus(moves[e.key]()); }
  };

  const monthOut = (yy: number, mm: number) =>
    (!!min && monthKey(yy, mm) < min.slice(0, 7)) || (!!max && monthKey(yy, mm) > max.slice(0, 7));
  const page = yearPage(y);

  return (
    <Shell label={formatDay(value)} placeholder={placeholder} ariaLabel={ariaLabel} disabled={disabled} id={id}
      clearable={clearable} onClear={() => onChange("")} onOpen={onOpen} pop={pop}
      inputClassName={inputClassName} invalid={invalid}>
      {view === "days" && (
        <>
          <Head
            title={`${MONTHS[m]} ${y}`}
            onTitle={() => setView("months")}
            onPrev={() => setFocus(addMonthsTo(focus, -1))}
            onNext={() => setFocus(addMonthsTo(focus, 1))}
            prevLabel="Previous month"
            nextLabel="Next month"
            prevDisabled={!!min && monthKey(y, m) <= min.slice(0, 7)}
            nextDisabled={!!max && monthKey(y, m) >= max.slice(0, 7)}
          />
          <div className="dtp-week" aria-hidden>{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="dtp-grid" ref={gridRef} role="grid" onKeyDown={onGridKey}>
            {cells.map((d) => {
              const k = dayKey(d);
              const isFocus = k === dayKey(focus);
              return (
                <button
                  key={k}
                  type="button"
                  className="dtp-day"
                  data-day={k}
                  data-other={d.getMonth() !== m || undefined}
                  data-today={k === today || undefined}
                  data-selected={k === value || undefined}
                  disabled={out(k)}
                  tabIndex={isFocus ? 0 : -1}
                  aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${k === today ? ", today" : ""}`}
                  aria-pressed={k === value}
                  onClick={() => pick(k)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}
      {view === "months" && (
        <>
          <Head title={String(y)} onTitle={() => setView("years")}
            onPrev={() => setFocus(addMonthsTo(focus, -12))} onNext={() => setFocus(addMonthsTo(focus, 12))}
            prevLabel="Previous year" nextLabel="Next year" />
          <Tiles
            items={SHORT.map((label, i) => ({
              key: String(i), label,
              selected: value.slice(0, 7) === monthKey(y, i),
              current: today.slice(0, 7) === monthKey(y, i),
              disabled: monthOut(y, i),
            }))}
            onPick={(k) => { setFocus(new Date(y, Number(k), Math.min(focus.getDate(), new Date(y, Number(k) + 1, 0).getDate()))); setView("days"); }}
          />
        </>
      )}
      {view === "years" && (
        <>
          <Head title={`${page} to ${page + 11}`}
            onPrev={() => setFocus(addMonthsTo(focus, -144))} onNext={() => setFocus(addMonthsTo(focus, 144))}
            prevLabel="Earlier years" nextLabel="Later years" />
          <Tiles
            items={Array.from({ length: 12 }, (_, i) => page + i).map((yy) => ({
              key: String(yy), label: String(yy),
              selected: value.slice(0, 4) === String(yy),
              current: today.slice(0, 4) === String(yy),
              disabled: (!!min && String(yy) < min.slice(0, 4)) || (!!max && String(yy) > max.slice(0, 4)),
            }))}
            onPick={(k) => { setFocus(new Date(Number(k), m, 1)); setView("months"); }}
          />
        </>
      )}
      <div className="dtp-foot">
        {clearable ? <button type="button" className="dtp-link" onClick={() => { onChange(""); pop.close(); }}>Clear</button> : <span />}
        <button type="button" className="dtp-link dtp-link--strong" disabled={out(today)} onClick={() => pick(today)}>Today</button>
      </div>
    </Shell>
  );
}

/* ── Month picker ───────────────────────────────────────────────────────── */

export function MonthPicker({
  value, onChange, min, max, placeholder = "Choose a month", ariaLabel, disabled, clearable = true, id,
  inputClassName = "po-input", invalid,
}: PickerProps) {
  const pop = usePopover();
  const now = new Date();
  const thisMonth = monthKey(now.getFullYear(), now.getMonth());
  const [year, setYear] = useState(() => parseMonth(value)?.y ?? now.getFullYear());
  const [years, setYears] = useState(false);

  const onOpen = () => {
    setYear(parseMonth(value)?.y ?? parseMonth(min ?? "")?.y ?? new Date().getFullYear());
    setYears(false);
  };

  const { place, popRef } = pop;
  const shown = pop.open && !!pop.pos;
  useEffect(() => {
    if (!shown) return;
    popRef.current?.querySelector<HTMLButtonElement>(".dtp-tile[data-selected], .dtp-tile[data-current], .dtp-tile:not(:disabled)")?.focus();
    place();
  }, [year, years, shown, place, popRef]);

  const out = (k: string) => (!!min && k < min) || (!!max && k > max);
  const page = yearPage(year);

  return (
    <Shell label={formatMonth(value)} placeholder={placeholder} ariaLabel={ariaLabel} disabled={disabled} id={id}
      clearable={clearable} onClear={() => onChange("")} onOpen={onOpen} pop={pop}
      inputClassName={inputClassName} invalid={invalid}>
      {!years ? (
        <>
          <Head title={String(year)} onTitle={() => setYears(true)}
            onPrev={() => setYear(year - 1)} onNext={() => setYear(year + 1)}
            prevLabel="Previous year" nextLabel="Next year"
            prevDisabled={!!min && String(year) <= min.slice(0, 4)} nextDisabled={!!max && String(year) >= max.slice(0, 4)} />
          <Tiles
            items={SHORT.map((label, i) => {
              const k = monthKey(year, i);
              return { key: k, label, selected: k === value, current: k === thisMonth, disabled: out(k) };
            })}
            onPick={(k) => { onChange(k); pop.close(); }}
          />
        </>
      ) : (
        <>
          <Head title={`${page} to ${page + 11}`} onPrev={() => setYear(year - 12)} onNext={() => setYear(year + 12)}
            prevLabel="Earlier years" nextLabel="Later years" />
          <Tiles
            items={Array.from({ length: 12 }, (_, i) => page + i).map((yy) => ({
              key: String(yy), label: String(yy),
              selected: value.slice(0, 4) === String(yy),
              current: thisMonth.slice(0, 4) === String(yy),
              disabled: (!!min && String(yy) < min.slice(0, 4)) || (!!max && String(yy) > max.slice(0, 4)),
            }))}
            onPick={(k) => { setYear(Number(k)); setYears(false); }}
          />
        </>
      )}
      <div className="dtp-foot">
        {clearable ? <button type="button" className="dtp-link" onClick={() => { onChange(""); pop.close(); }}>Clear</button> : <span />}
        <button type="button" className="dtp-link dtp-link--strong" disabled={out(thisMonth)}
          onClick={() => { onChange(thisMonth); pop.close(); }}>This month</button>
      </div>
    </Shell>
  );
}
