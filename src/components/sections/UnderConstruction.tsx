import Link from "next/link";
import { Construction, Stethoscope, Newspaper, Phone } from "lucide-react";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { BookButton } from "@/components/ui/BookButton";

interface Props {
  /** What is being updated, in the reader's terms — "our history and team". */
  subject: string;
  /** One or two sentences on why, so the page does not read as broken. */
  message: string;
}

const ELSEWHERE = [
  { href: "/services", icon: Stethoscope, label: "Our services", hint: "Departments and specialist clinics" },
  { href: "/news", icon: Newspaper, label: "News & updates", hint: "The latest from the hospital" },
  { href: "/contact", icon: Phone, label: "Contact us", hint: "Phone, email and directions" },
];

/**
 * A holding notice for a page whose content is being revised. Server-rendered
 * and self-contained, so it can stand in for any page behind a single flag.
 */
export function UnderConstruction({ subject, message }: Props) {
  return (
    <section className="uc-section">
      <div className="container">
        <AnimateIn>
          <div className="uc-card">
            <div className="uc-icon" aria-hidden="true">
              <Construction size={30} strokeWidth={1.75} />
            </div>
            <div className="section-tag" style={{ justifyContent: "center" }}>
              <span>Being updated</span>
            </div>
            <h2 className="section-heading uc-heading">We&rsquo;re refreshing {subject}</h2>
            <p className="uc-message">{message}</p>

            <div className="uc-links">
              {ELSEWHERE.map(({ href, icon: Icon, label, hint }) => (
                <Link key={href} href={href} className="uc-link">
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                  <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                </Link>
              ))}
            </div>

            <div className="uc-cta">
              <BookButton />
            </div>
          </div>
        </AnimateIn>
      </div>

      <style>{`
        .uc-section { padding: 5rem 2rem; background: var(--bg-light, #F7F9F7); }
        .uc-card {
          max-width: 720px; margin: 0 auto; text-align: center;
          background: #fff; border: 1px solid #E2EBE7; border-radius: var(--radius-lg, 16px);
          padding: 3rem 2.5rem; box-shadow: 0 12px 40px rgba(6, 51, 40, 0.06);
        }
        .uc-icon {
          width: 64px; height: 64px; margin: 0 auto 1.25rem; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(232, 184, 75, 0.16); color: #9A6B0E;
        }
        .uc-heading { margin-bottom: 1rem; }
        .uc-message {
          color: var(--text-mid); line-height: 1.8; font-size: 1.02rem;
          max-width: 560px; margin: 0 auto 2.25rem;
        }
        .uc-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 2rem; }
        .uc-link {
          display: flex; align-items: flex-start; gap: 10px; text-align: left;
          padding: 14px; border: 1px solid #E2EBE7; border-radius: 12px;
          color: var(--primary); text-decoration: none;
          transition: border-color .15s ease, background .15s ease, transform .15s ease;
        }
        .uc-link:hover { border-color: var(--primary); background: #F4F9F6; transform: translateY(-2px); }
        .uc-link svg { flex-shrink: 0; margin-top: 2px; }
        .uc-link strong { display: block; font-size: .92rem; color: var(--text-dark, #111); }
        .uc-link small { display: block; font-size: .78rem; color: var(--text-light, #6B7C74); margin-top: 2px; line-height: 1.4; }
        .uc-cta { display: flex; justify-content: center; }
        @media (max-width: 767.98px) {
          .uc-section { padding: 3.5rem 1rem; }
          .uc-card { padding: 2.25rem 1.25rem; }
          .uc-links { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) { .uc-link { transition: none; } .uc-link:hover { transform: none; } }
      `}</style>
    </section>
  );
}
