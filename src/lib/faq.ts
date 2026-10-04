import { SITE } from "@/lib/data";

/**
 * Patient FAQs, shown on /faq (all of them) and on /contact (the `featured` ones).
 * Answers only state what the hospital has confirmed elsewhere on the site:
 * check with the hospital before adding policies such as visiting hours or fees.
 */

export type FaqLink = { href: string; label: string };

export type FaqItem = {
  id: string;
  question: string;
  /** Plain-text paragraphs. Also used for the search-engine FAQ markup. */
  answer: string[];
  links?: FaqLink[];
  featured?: boolean;
};

export type FaqTopic = {
  id: string;
  title: string;
  icon: "emergency" | "appointment" | "visit" | "payment" | "services" | "privacy";
  items: FaqItem[];
};

const [EMERGENCY_1, EMERGENCY_2] = SITE.emergencyPhones;

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: "emergencies",
    title: "Emergencies",
    icon: "emergency",
    items: [
      {
        id: "emergency-what-to-do",
        question: "What should I do in an emergency?",
        answer: [
          `Call our emergency lines, ${EMERGENCY_1} or ${EMERGENCY_2}, or come straight to the Emergency Unit. Both lines are answered 24 hours a day, every day, including weekends and public holidays.`,
          "Please do not use the website's forms for anything urgent. They are not monitored around the clock.",
        ],
        featured: true,
      },
      {
        id: "emergency-office-line",
        question: `Can I call the office number, ${SITE.phone}, in an emergency?`,
        answer: [
          `No. ${SITE.phone} is the administration office line. It is only answered ${SITE.phoneHours}, and not on weekends or public holidays. For emergencies, always use ${EMERGENCY_1} or ${EMERGENCY_2}.`,
        ],
      },
    ],
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: "appointment",
    items: [
      {
        id: "book-appointment",
        question: "How do I book an appointment?",
        answer: [
          "Fill in the appointment form on this website with your details and the service you need. Our team will call you within 24 hours to confirm a time.",
          "Your request is not a confirmed appointment until we call you to confirm it.",
        ],
        links: [{ href: "/appointment", label: "Book an appointment" }],
        featured: true,
      },
      {
        id: "walk-in",
        question: "Do I need an appointment, or can I walk in?",
        answer: [
          "Walk-ins are welcome. Come to the Out-Patient Department, where you will be registered and seen in order of need. Booking ahead simply helps us plan your visit.",
        ],
        links: [{ href: "/services/outpatient", label: "About out-patient care" }],
      },
      {
        id: "change-appointment",
        question: "How do I change or cancel an appointment?",
        answer: [
          `Call the administration office on ${SITE.phone} (${SITE.phoneHours}), or send us a message through the contact page with your name and the date of your appointment.`,
        ],
        links: [{ href: "/contact", label: "Send us a message" }],
      },
    ],
  },
  {
    id: "visiting",
    title: "Visiting the hospital",
    icon: "visit",
    items: [
      {
        id: "where-are-you",
        question: "Where is the hospital?",
        answer: [
          `We are in Hwidiem, off the Kumasi–Goaso highway, in the Asutifi South District of the Ahafo Region. The contact page has directions you can open in Google Maps.`,
        ],
        links: [{ href: "/contact", label: "Get directions" }],
        featured: true,
      },
      {
        id: "parking",
        question: "Is there parking at the hospital?",
        answer: [
          "Yes. The hospital has a car park, so you can drive in and park on site when you visit.",
        ],
      },
      {
        id: "opening-hours",
        question: "When is the hospital open?",
        answer: [
          `The hospital and its Emergency Unit are open ${SITE.hours}. The administration office is open ${SITE.phoneHours} and is closed on public holidays.`,
        ],
      },
      {
        id: "what-to-bring",
        question: "What should I bring to my visit?",
        answer: [
          "Please bring your NHIS card or other insurance details, a valid ID, any previous medical records, test results or referral letters, and any medicines you are currently taking.",
        ],
        featured: true,
      },
      {
        id: "who-we-treat",
        question: "Do I have to be Catholic to be treated here?",
        answer: [
          "No. St. Elizabeth Catholic Hospital is a Christian Health Association of Ghana (CHAG) member institution and cares for everyone who needs it, whatever their faith or background.",
        ],
      },
    ],
  },
  {
    id: "payment",
    title: "Insurance and payment",
    icon: "payment",
    items: [
      {
        id: "nhis",
        question: "Do you accept NHIS?",
        answer: [
          "Yes. We accept the National Health Insurance Scheme (NHIS) and most major insurers. Please bring your card with you when you visit.",
        ],
        featured: true,
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    icon: "services",
    items: [
      {
        id: "what-services",
        question: "What services does the hospital offer?",
        answer: [
          "We offer care across medicine, surgery, maternity, diagnostics and specialist clinics, including eye care, dental, ENT, psychiatry, laboratory and imaging. The services page lists every department and lets you search for what you need.",
        ],
        links: [{ href: "/services", label: "Browse our services" }],
      },
      {
        id: "pharmacy",
        question: "Is there a pharmacy at the hospital?",
        answer: [
          "Yes. The hospital pharmacy is stocked with WHO essential medicines and a range of specialised drugs, and serves both in-patients and out-patients. Our pharmacists explain how to take your medicines safely.",
        ],
        links: [{ href: "/services/pharmacy", label: "About the pharmacy" }],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy and this website",
    icon: "privacy",
    items: [
      {
        id: "personal-information",
        question: "Is the information I give on this website kept private?",
        answer: [
          "Yes. Appointment requests are only seen by authorised hospital staff and used to arrange your care. We handle personal information in line with Ghana's Data Protection Act, 2012 (Act 843), and never sell or share it outside the hospital except where the law requires.",
        ],
        links: [{ href: "/disclaimer#personal-information", label: "Read our privacy notice" }],
      },
      {
        id: "records-and-enquiries",
        question: "How do I ask about medical records or make a general enquiry?",
        answer: [
          `Email ${SITE.email} for general enquiries, records requests and partnerships. For short questions you can also send a message through the contact page.`,
        ],
        links: [{ href: "/contact", label: "Contact us" }],
      },
      {
        id: "comment-not-showing",
        question: "Why has my comment on a news article not appeared yet?",
        answer: [
          "Every comment is read by hospital staff before it is published, so it can take a little while to appear. Your email address is never shown publicly.",
        ],
      },
      {
        id: "newsletter",
        question: "How do I subscribe to, or leave, the newsletter?",
        answer: [
          "Sign up with your email address at the bottom of any page. Every newsletter email includes a link to unsubscribe, and you can also email us to have your address removed.",
        ],
      },
    ],
  },
];

export const FEATURED_FAQS: FaqItem[] = FAQ_TOPICS.flatMap((t) => t.items).filter((i) => i.featured);

/** schema.org FAQPage markup, so search engines can show answers directly. */
export function faqJsonLd(topics: FaqTopic[] = FAQ_TOPICS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topics.flatMap((t) =>
      t.items.map((i) => ({
        "@type": "Question",
        name: i.question,
        acceptedAnswer: { "@type": "Answer", text: i.answer.join(" ") },
      })),
    ),
  };
}
