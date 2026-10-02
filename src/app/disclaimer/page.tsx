import "@/styles/legal.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SITE, telHref } from "@/lib/data";

export const metadata: Metadata = {
  title: "Disclaimer & Privacy",
  description:
    "Terms of use, medical disclaimer, cookies and how St. Elizabeth Catholic Hospital handles the information you give us through this website.",
};

const LAST_UPDATED = "2 October 2026";

const SECTIONS = [
  { id: "about", title: "About this page" },
  { id: "medical", title: "Medical information" },
  { id: "intellectual-property", title: "Intellectual property" },
  { id: "liability", title: "Disclaimer of liability" },
  { id: "personal-information", title: "Your personal information" },
  { id: "cookies", title: "Cookies and analytics" },
  { id: "newsletter", title: "E-newsletter" },
  { id: "external-links", title: "Links to other websites" },
  { id: "virus-protection", title: "Virus protection" },
  { id: "changes", title: "Changes to this page" },
];

export default function DisclaimerPage() {
  // Office line: weekday office hours only. Emergencies use the 24-hour lines.
  const phone = SITE.phone;
  const tel = telHref(phone);
  const emergency = (
    <>
      <a href={telHref(SITE.emergencyPhones[0])}>{SITE.emergencyPhones[0]}</a> or{" "}
      <a href={telHref(SITE.emergencyPhones[1])}>{SITE.emergencyPhones[1]}</a>
    </>
  );
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;

  return (
    <>
      <PageHero
        tag="Legal"
        title="Disclaimer & Privacy"
        subtitle="How this website may be used, and how we look after the information you share with us."
        dotGrid
      />

      <section className="lg-page">
        <div className="lg-container">
          <aside className="lg-toc" aria-label="On this page">
            <div className="lg-toc-inner">
              <span className="lg-toc-label">On this page</span>
              <ol>
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.title}</a>
                  </li>
                ))}
              </ol>
              <p className="lg-updated">Last updated {LAST_UPDATED}</p>
            </div>
          </aside>

          <article className="lg-body">
            <div className="lg-emergency" role="note">
              <AlertTriangle size={22} aria-hidden="true" />
              <div>
                <strong>In an emergency, do not use this website.</strong>
                <span>
                  Call our emergency lines, {emergency}, or come straight to our Emergency Unit, open 24 hours a
                  day, 7 days a week.
                </span>
              </div>
            </div>

            <section id="about">
              <h2>About this page</h2>
              <p>
                This disclaimer applies to the website of {SITE.name} (&ldquo;SECH&rdquo;, &ldquo;the hospital&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;) at <strong>sech-gh.org</strong>, including its news pages, online
                appointment form and staff portal. By using the website you accept the terms below.
              </p>
              <p>
                We may move or change the addresses (URLs) of pages at any time as we improve our online services.
                If you link to our website, please link to our homepage or to a section page such as{" "}
                <Link href="/services">Services</Link> or <Link href="/news">News</Link>, which are less likely to
                change than individual pages. Links to our website are made at your own risk.
              </p>
            </section>

            <section id="medical">
              <h2>Medical information</h2>
              <p>
                The health information on this website, including our news articles, health tips and service
                descriptions, is for general information only. It is not a substitute for advice, diagnosis or
                treatment from a qualified health professional who knows your circumstances.
              </p>
              <ul>
                <li>Always seek the advice of a doctor, nurse or other qualified health worker about a medical condition.</li>
                <li>Never ignore professional medical advice, or delay seeking it, because of something you read here.</li>
                <li>
                  Do not send urgent or detailed medical information through the website&rsquo;s forms or comments.
                  They are not monitored around the clock. For anything urgent, call our emergency lines, {emergency}.
                </li>
              </ul>
              <p>
                Submitting the online appointment form is a request, not a confirmed appointment, until the hospital
                contacts you to confirm it.
              </p>
            </section>

            <section id="intellectual-property">
              <h2>Intellectual property</h2>
              <p>
                The name, crest, logo, photographs and written content on this website belong to {SITE.name}
                unless stated otherwise. You may share links to our pages and quote short extracts with credit to
                the hospital. Please do not copy, alter or reuse our logo, photographs or substantial content
                without our written permission.
              </p>
              <p>
                The logos of the Christian Health Association of Ghana (CHAG), the Ghana Health Service and the
                Ministry of Health are the property of those organisations and are shown to identify our
                affiliations.
              </p>
              <p>
                To ask permission to use our logo or content, email {mail}. Tell us how and why you want to use it,
                and include your name, organisation, address and telephone number.
              </p>
            </section>

            <section id="liability">
              <h2>Disclaimer of liability</h2>
              <p>
                We work to keep this website accurate and up to date, but it and the information on it are
                provided &ldquo;as is&rdquo;, without any guarantee of any kind, express or implied, including of
                accuracy, completeness, fitness for a particular purpose or availability. Details such as opening
                hours, services, fees and staff may change without notice. Please call us to confirm before you
                travel.
              </p>
              <p>
                We do not guarantee that the website will be uninterrupted or free from errors, that faults will be
                corrected, or that the website or the server that makes it available is free of viruses or other
                harmful components.
              </p>
              <p>
                As far as the law allows, the hospital is not liable for any loss or damage, whether direct,
                indirect or consequential, including loss of data or profits, arising from use of, or inability to
                use, this website or from reliance on its content.
              </p>
              <p>
                These terms are governed by the laws of the Republic of Ghana, and any dispute arising from them is
                subject to the jurisdiction of the courts of Ghana.
              </p>
            </section>

            <section id="personal-information">
              <h2>Your personal information</h2>
              <p>
                We only collect personal information that you choose to give us through this website:
              </p>
              <ul>
                <li>
                  <strong>Appointment requests</strong>: your name, contact details, date of birth, the service you
                  need, your insurance details and any notes you add. These are used only to arrange your care and are
                  available only to authorised hospital administrators.
                </li>
                <li>
                  <strong>Comments on news articles</strong>: your name, email address and comment. Every comment is
                  read by hospital staff before it appears. Your email address is never published.
                </li>
                <li>
                  <strong>Newsletter sign-ups</strong>: your email address (see{" "}
                  <a href="#newsletter">E-newsletter</a> below).
                </li>
              </ul>
              <p>
                We handle this information in line with Ghana&rsquo;s Data Protection Act, 2012 (Act 843). We do not
                sell it, and we do not share it with anyone outside the hospital except where the law requires us to.
                You can ask to see, correct or delete the information we hold about you by emailing {mail} or calling
                the administration office on <a href={tel}>{phone}</a> ({SITE.phoneHours}).
              </p>
            </section>

            <section id="cookies">
              <h2>Cookies and analytics</h2>
              <p>
                A cookie is a small file that a website stores in your browser. The public pages of this website do
                not use advertising or tracking cookies, and we do not currently use third-party analytics such as
                Google Analytics.
              </p>
              <p>
                The only cookies we set are strictly necessary ones that keep hospital staff signed in to the staff
                portal. They are not set for ordinary visitors and are not used to track anyone.
              </p>
              <p>
                Some links, such as directions in Google Maps, take you to other services that have their own cookie
                policies. You can restrict or delete cookies at any time in your browser settings. The help section
                of your browser explains how.
              </p>
              <p>
                If we start using analytics in future, we will update this page before we do.
              </p>
            </section>

            <section id="newsletter">
              <h2>E-newsletter</h2>
              <p>
                You can sign up at the bottom of any page to receive occasional emails from the hospital with health
                tips, service updates and hospital news. We only add your address after you tick the box to agree.
              </p>
              <ul>
                <li>We use your email address only to send you the newsletter.</li>
                <li>We never sell, rent or share our mailing list.</li>
                <li>
                  Every email includes a link to unsubscribe. You can also unsubscribe, or ask us to delete your
                  address completely, by emailing {mail}.
                </li>
              </ul>
            </section>

            <section id="external-links">
              <h2>Links to other websites</h2>
              <p>
                This website contains links to websites that we do not control, such as those of our partners and
                health authorities. We are not responsible for their content or availability, and a link is not an
                endorsement of any kind. We cannot guarantee that these links will always work.
              </p>
            </section>

            <section id="virus-protection">
              <h2>Virus protection</h2>
              <p>
                We take care to check material on this website, but we recommend that you run up-to-date antivirus
                software on anything you download from the internet. We cannot accept responsibility for any loss,
                disruption or damage to your data or device that may occur while using material from this website.
              </p>
            </section>

            <section id="changes">
              <h2>Changes to this page</h2>
              <p>
                We may update this disclaimer at any time. The date at the top of this page shows when it was last
                changed. By continuing to use the website after a change, you accept the updated terms.
              </p>
              <div className="lg-contact">
                <div>
                  <strong>Questions about this page?</strong>
                  <span>
                    Contact {SITE.name}, {SITE.address}. The administration office is open {SITE.phoneHours}.
                  </span>
                </div>
                <a href={tel} className="lg-btn">
                  <Phone size={16} aria-hidden="true" /> {phone}
                </a>
              </div>
            </section>
          </article>
        </div>
      </section>
    </>
  );
}
