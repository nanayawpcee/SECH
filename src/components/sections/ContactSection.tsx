"use client";

import { useState } from "react";
import { SITE } from "@/lib/data";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Partners } from "./partnerslider";

const CONTACT_INFO = [
  {
    icon: "📍",
    label: "Address",
    value: SITE.address,
    href: "https://www.google.com/maps/place/St.+Elizabeth+Catholic+Hospital/@6.9325332,-2.3606433,17z",
  },
  { icon: "📞", label: "Phone", value: SITE.phone, href: `tel:${SITE.phone}` },
  {
    icon: "✉️",
    label: "Email",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
  },
  { icon: "⏰", label: "Hours", value: SITE.hours, href: undefined },
];

// Grouped partner data
const ACCREDITATIONS = [
  "Ministry of Health",
  "CHAG",
  "Ghana Health Service",
  "NHIS",
  "Catholic Health Service Trust",
];

const CORPORATE_PARTNERS = [
  "Newmont",
  "Toyota Ghana",
  "MANTRAC",
  "UMA",
  "Prime Insurance",
  "NEDCO/VRA",
  "Bridge Life Foundation",
  "Cornelia Connelly of the Holy Child Jesus",
  "Church of Pentecost",
];

export function ContactSection() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName || !form.message) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSending(false);
    setSubmitted(true);
  };

  // Combines all partners for a single continuous scrolling track
  const allPartners = [...ACCREDITATIONS, ...CORPORATE_PARTNERS];

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        {/* 2-col grid */}
        <div className="contact-grid">
          {/* Left — contact info */}
          <AnimateIn direction="left">
            <div className="contact-tagbar">
              <div className="bar" />
              <span className="contact-tag">Reach Us</span>
            </div>
            <h2 className="contact-h2">Get in Touch</h2>

            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", gap: 16, marginBottom: 22 }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {item.icon}
                </span>
                <div>
                  <div className="contact-info-label">{item.label}</div>
                  {item.href ? (
                    <a href={item.href} className="contact-link">{item.value}</a>
                  ) : (
                    <div className="contact-link">{item.value}</div>
                  )}
                </div>
              </div>
            ))}
          </AnimateIn>

          {/* Right — contact form */}
          <AnimateIn delay={160} direction="right">
            <div className="contact-form">
              {submitted ? (
                <div className="contact-success">
                  <div className="emoji">✅</div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll respond to <strong style={{ color: '#fff' }}>{form.email || 'you'}</strong> as soon as possible.</p>
                  <button onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', email: '', message: '' }); }} className="btn-accent">Send Another</button>
                </div>
              ) : (
                <>
                  <h3
                    style={{
                      color: "#fff",
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      margin: "0 0 1.25rem",
                      fontSize: "1.1rem",
                    }}
                  >
                    Send a Message
                  </h3>
                  <div className="contact-name-grid">
                    {[
                      { key: "firstName", placeholder: "First Name" },
                      { key: "lastName", placeholder: "Last Name" },
                    ].map((f) => (
                      <div className="form-group" key={f.key}>
                        <input
                          className="form-input form-input--inverted"
                          placeholder={f.placeholder}
                          value={(form as Record<string, string>)[f.key]}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, [f.key]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <input className="form-input form-input--inverted" type="email" placeholder="Email Address" value={form.email} onChange={(e)=>setForm((p)=>({...p,email:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <textarea className="form-input form-input--inverted form-input--textarea" rows={4} placeholder="Your message…" value={form.message} onChange={(e)=>setForm((p)=>({...p,message:e.target.value}))} />
                  </div>
                  <button onClick={handleSubmit} disabled={sending} className="btn-accent inverted" style={{ opacity: sending ? 0.8 : 1 }}>
                    {sending ? "Sending…" : "Send Message →"}
                  </button>
                </>
              )}
            </div>
          </AnimateIn>
        </div>

        {/* NEW: Full Width Horizontal Infinite Logo Slider */}
        <Partners />
      </div>
    </section>
  );
}
