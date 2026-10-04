import "@/styles/faq.css";
import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { FaqList } from "@/components/faq/FaqList";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_TOPICS, faqJsonLd, type FaqTopic } from "@/lib/faq";
import { SITE, telHref } from "@/lib/data";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about St. Elizabeth Catholic Hospital, Hwidiem: emergencies, appointments, NHIS, opening hours, what to bring and more.",
  alternates: { canonical: "/faq" },
};

const TOPIC_ICONS: Record<FaqTopic["icon"], LucideIcon> = {
  emergency: Siren,
  appointment: CalendarCheck,
  visit: MapPin,
  payment: CreditCard,
  services: Stethoscope,
  privacy: ShieldCheck,
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />

      <PageHero
        tag="Help"
        title="Frequently Asked Questions"
        subtitle="Quick answers about emergencies, appointments, insurance and visiting the hospital."
        dotGrid
      />

      <section className="fq-page">
        <div className="fq-container">
          <aside className="fq-toc" aria-label="Topics">
            <div className="fq-toc-inner">
              <span className="fq-toc-label">Topics</span>
              <ol>
                {FAQ_TOPICS.map((t) => {
                  const Icon = TOPIC_ICONS[t.icon];
                  return (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>
                        <Icon size={16} aria-hidden="true" />
                        {t.title}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          <div className="fq-body">
            <div className="fq-emergency" role="note">
              <Siren size={22} aria-hidden="true" />
              <div>
                <strong>Is it an emergency?</strong>
                <span>
                  Call{" "}
                  {SITE.emergencyPhones.map((n, i) => (
                    <span key={n}>
                      {i > 0 && " or "}
                      <a href={telHref(n)}>{n}</a>
                    </span>
                  ))}
                  , day or night, or come straight to our Emergency Unit.
                </span>
              </div>
            </div>

            {FAQ_TOPICS.map((t) => {
              const Icon = TOPIC_ICONS[t.icon];
              return (
                <section key={t.id} id={t.id} className="fq-topic" aria-labelledby={`${t.id}-title`}>
                  <h2 id={`${t.id}-title`}>
                    <span className="fq-topic-icon" data-icon={t.icon}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    {t.title}
                  </h2>
                  <FaqList items={t.items} />
                </section>
              );
            })}

            <div className="fq-more">
              <div>
                <h2>Still have a question?</h2>
                <p>Send us a message, or call the administration office, open {SITE.phoneHours}.</p>
              </div>
              <div className="fq-more-actions">
                <Link href="/contact" className="fq-btn">
                  <MessageCircle size={16} aria-hidden="true" />Send a message
                </Link>
                <a href={telHref(SITE.phone)} className="fq-btn fq-btn--ghost">
                  <Phone size={16} aria-hidden="true" />{SITE.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
