import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/faq";

/** Expanding questions built on <details>, so they work without JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="fq-list">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="fq-item">
          <summary>
            <span>{item.question}</span>
            <ChevronDown size={18} aria-hidden="true" className="fq-chevron" />
          </summary>
          <div className="fq-answer">
            {item.answer.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {item.links && (
              <div className="fq-links">
                {item.links.map((l) => (
                  <Link key={l.href} href={l.href} className="fq-link">
                    {l.label}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
