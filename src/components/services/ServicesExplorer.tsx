"use client";

import "@/styles/services.css";
import { useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FlaskConical,
  HeartPulse,
  ScanLine,
  Search,
  Stethoscope,
  X,
  type LucideIcon,
} from "lucide-react";

export interface CategoryItem {
  name: string;
  slug?: string;
}

export interface Category {
  key: string;
  title: string;
  subtitle: string;
  featured: boolean;
  featuredLabel?: string;
  icon: string;
  iconTone: string;
  headerBg: string;
  dotColor: string;
  items: CategoryItem[];
}

export interface ServiceTile {
  slug: string;
  title: string;
  shortDesc: string;
  image: string | null;
  icon: string | null;
  category: string;
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  general: HeartPulse,
  specialist: Stethoscope,
  diagnostic: ScanLine,
  laboratory: FlaskConical,
};

/** Items shown before "Show all", so tall lists don't dwarf the short ones. */
const FOLD = 7;

/** Popular services. Each label matches real items in the lists below. */
const QUICK_PICKS: { label: string; query: string }[] = [
  { label: "Antenatal (ANC)", query: "antenatal" },
  { label: "Eye", query: "eye" },
  { label: "Laboratory", query: "laboratory" },
  { label: "X-Ray", query: "x-ray" },
  { label: "Dental", query: "dental" },
  { label: "Pharmacy", query: "pharmacy" },
];

/**
 * Other words people use for a service, so search finds "ANC Services" when
 * someone types "antenatal", "pregnancy" or "ante-natal". Keyed by the page
 * slug an item links to, or by the item's name when it has no page.
 */
const ALSO_KNOWN_AS: Record<string, string> = {
  antenatal: "antenatal ante-natal anc pregnancy pregnant maternal",
  postnatal: "postnatal post-natal after delivery mother baby reproductive",
  cwc: "child welfare weighing immunisation immunization vaccination baby",
  laboratory: "laboratory lab test tests blood sample",
  dental: "dental dentist dentistry teeth tooth",
  OPG: "dental x-ray xray panoramic teeth tooth opg",
  "x-ray": "x-ray xray x ray radiology imaging",
  ultrasound: "ultrasound scan sonography imaging pregnancy",
  ecg: "ecg ekg electrocardiogram heart cardiac",
  ENT: "ent ear nose throat hearing",
  "eye-center": "eye eyes ophthalmology vision optical",
  psychiatry: "psychiatry mental health counselling counseling",
  nutrition: "nutrition diet dietitian food",
  pharmacy: "pharmacy drugs medicine medicines prescription",
  outpatient: "opd out-patient outpatient consultation doctor",
  inpatient: "in-patient inpatient ward admission admitted",
  "24-Hour Emergency Services": "emergency accident casualty urgent",
  "Wellness Clinic": "wellness check-up checkup screening",
  "Obstetrics & Gynaecology (Maternal)": "obstetrics gynaecology gynecology maternity pregnancy antenatal women",
  "Paediatric (Child Health)": "paediatric pediatric children child",
  "General Surgery": "surgery surgical operation theatre",
  Physiotherapy: "physiotherapy physio rehabilitation",
  "Counselling / ART Services": "counselling counseling art hiv",
  "Family Medicine": "family medicine general doctor",
};

/** Lower-case words, with hyphens and punctuation ignored ("Ante-Natal" = "antenatal"). */
function words(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]+/g, "").split(/\s+/).filter(Boolean);
}

function normalise(s: string) {
  return words(s).join(" ");
}

/**
 * Every word the visitor typed matches the start of a word in the text, so
 * "cardio" finds "cardiology". Short words (3 letters or fewer, like "ear",
 * "eye", "anc") must match a whole word, so "ear" doesn't find "early". Two
 * neighbouring words count as one ("antenatal" finds "Ante Natal"). Hyphens
 * are ignored throughout ("x-ray" = "xray"), and so are spaces inside a term
 * ("ante natal" = "antenatal").
 */
function matchesText(haystack: string, query: string) {
  const q = words(query);
  if (!q.length) return true;
  const hay = words(haystack);
  const pairs = hay.slice(1).map((w, i) => hay[i] + w);
  // "ante natal" typed with a space still finds "Ante-Natal".
  const joined = q.join("");
  if (q.length > 1 && joined.length >= 4 && (hay.some((h) => h.startsWith(joined)) || pairs.some((p) => p.startsWith(joined)))) {
    return true;
  }
  return q.every((w) =>
    w.length <= 3
      ? hay.includes(w)
      : hay.some((h) => h.startsWith(w)) || pairs.some((p) => p.startsWith(w)),
  );
}

/**
 * The interactive part of /services: search, the four category cards, and
 * the photo gallery of services that have their own page.
 */
export function ServicesExplorer({ categories, tiles }: { categories: Category[]; tiles: ServiceTile[] }) {
  const [query, setQuery] = useState("");
  const q = normalise(useDeferredValue(query));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [galleryFilter, setGalleryFilter] = useState("all");

  // What each item can be found by: its name, the page it links to, its
  // department, and the other names people use.
  const tileBySlug = useMemo(() => new Map(tiles.map((t) => [t.slug, t])), [tiles]);
  const itemText = (c: Category, i: CategoryItem) => {
    const page = i.slug ? tileBySlug.get(i.slug) : undefined;
    return [i.name, page?.title, c.title, ALSO_KNOWN_AS[i.slug ?? ""], ALSO_KNOWN_AS[i.name]].filter(Boolean).join(" ");
  };

  const filtered = useMemo(
    () => categories.map((c) => ({ ...c, shown: c.items.filter((i) => !q || matchesText(itemText(c, i), q)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, q],
  );
  const total = filtered.reduce((n, c) => n + c.shown.length, 0);

  const categoryTitle = (key: string) => categories.find((c) => c.key === key)?.title ?? "";
  const galleryTiles = tiles.filter(
    (t) =>
      (galleryFilter === "all" || t.category === galleryFilter) &&
      (!q || matchesText([t.title, t.shortDesc, categoryTitle(t.category), ALSO_KNOWN_AS[t.slug]].join(" "), q)),
  );

  return (
    <>
      {/* Search, overlapping the hero */}
      <div className="sv-finder">
        <label className="sv-search">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a service, e.g. scan, antenatal, eye"
            aria-label="Find a service"
          />
          {query && (
            <button type="button" className="sv-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </label>
        <div className="sv-picks" aria-label="Popular services">
          <span>Popular:</span>
          {QUICK_PICKS.map((p) => {
            const active = normalise(query) === normalise(p.query);
            return (
              <button key={p.label} type="button" className="sv-pick" aria-pressed={active}
                onClick={() => setQuery(active ? "" : p.query)}>
                {p.label}
              </button>
            );
          })}
        </div>
        {q && (
          <p className="sv-results" aria-live="polite">
            {total === 0
              ? <>No services match “{query.trim()}”. <Link href="/contact">Ask us</Link> and we’ll point you the right way.</>
              : <>{total} {total === 1 ? "service matches" : "services match"} “{query.trim()}”</>}
          </p>
        )}
      </div>

      {/* The four category cards */}
      <section className="sv-section" aria-labelledby="sv-cats-title">
        <div className="sv-head">
          <span className="sv-eyebrow">Four departments</span>
          <h2 id="sv-cats-title">Comprehensive care, organised for you</h2>
          <p>Every service at St. Elizabeth Catholic Hospital sits within one of four departments, each staffed by dedicated specialists.</p>
        </div>

        <div className="sv-cats">
          {filtered.map((c) => {
            const expanded = !!open[c.key] || !!q;
            const list = expanded ? c.shown : c.shown.slice(0, FOLD);
            const hidden = c.shown.length - list.length;
            const empty = q && c.shown.length === 0;
            return (
              <article key={c.key} className="sv-cat" data-featured={c.featured || undefined} data-empty={empty || undefined}>
                {c.featured && <span className="sv-ribbon">{c.featuredLabel ?? "Featured"}</span>}
                <header className="sv-cat-head" style={{ background: c.headerBg }}>
                  <span className="sv-cat-icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.icon} alt="" aria-hidden="true" width={30} height={30}
                      style={{ filter: c.iconTone === "light" ? "brightness(0.6) saturate(1.15)" : undefined }} />
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.subtitle}</p>
                  <span className="sv-count">{c.items.length} services</span>
                </header>

                <div className="sv-cat-body">
                  <span className="sv-includes">{q ? "Matching" : "Includes"}</span>
                  {empty ? (
                    <p className="sv-none">No matching services here.</p>
                  ) : (
                    <ul>
                      {list.map((item) => (
                        <li key={item.name}>
                          {item.slug ? (
                            <Link href={`/services/${item.slug}`} className="sv-item sv-item--link">
                              <span className="sv-dot" style={{ background: c.dotColor }} />
                              <span className="sv-item-name">{item.name}</span>
                              <ArrowUpRight size={15} className="sv-item-go" aria-hidden="true" />
                            </Link>
                          ) : (
                            <span className="sv-item">
                              <span className="sv-dot" style={{ background: c.dotColor }} />
                              <span className="sv-item-name">{item.name}</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!q && hidden > 0 && (
                    <button type="button" className="sv-more" onClick={() => setOpen((o) => ({ ...o, [c.key]: true }))}>
                      Show all {c.items.length}<ChevronDown size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <footer className="sv-cat-foot">
                  <Link href="/appointment" className="sv-cta" data-featured={c.featured || undefined}>
                    Book a consultation<ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {/* Photo gallery of services with their own page */}
      <section className="sv-section sv-section--gallery" aria-labelledby="sv-gallery-title">
        <div className="sv-head sv-head--row">
          <div>
            <span className="sv-eyebrow">In detail</span>
            <h2 id="sv-gallery-title">Explore our services</h2>
          </div>
          <div className="sv-tabs" role="group" aria-label="Filter by department">
            {[{ key: "all", title: "All" }, ...categories.map((c) => ({ key: c.key, title: c.title.replace(" Services", "") }))].map((t) => (
              <button key={t.key} type="button" className="sv-tab" aria-pressed={galleryFilter === t.key} onClick={() => setGalleryFilter(t.key)}>
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {galleryTiles.length === 0 ? (
          <p className="sv-none sv-none--center">No detailed pages match. Try another department or search.</p>
        ) : (
          <div className="sv-gallery">
            {galleryTiles.map((t) => {
              const Icon = CATEGORY_ICON[t.category] ?? Stethoscope;
              return (
                <Link key={t.slug} href={`/services/${t.slug}`} className="sv-tile">
                  <div className="sv-tile-media">
                    {t.image ? (
                      <Image src={t.image} alt="" fill sizes="(max-width: 640px) 100vw, 300px" className="sv-tile-img" />
                    ) : (
                      <div className="sv-tile-fallback" aria-hidden="true">
                        <span className="sv-plate">
                          {t.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.icon} alt="" width={48} height={48} />
                          ) : (
                            <Icon size={40} strokeWidth={1.6} />
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="sv-tile-body">
                    <h3>{t.title}</h3>
                    <p>{t.shortDesc}</p>
                    <span className="sv-tile-more">Learn more<ArrowRight size={15} aria-hidden="true" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
