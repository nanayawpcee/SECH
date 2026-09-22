// ─── Site-wide constants ───────────────────────────────────────
export const SITE = {
  name: "St. Elizabeth Catholic Hospital",
  shortName: "SECH",
  tagline: "Healing with Faith & Excellence",
  phone: " 032 229 8428",
  email: "info@sech-gh.org",
  address: "Hwidiem, Asutufi South District,Ahafo Region, Ghana",
  hours: "24 hours, 7 days a week",
  chag: true,
};

// ─── Services ──────────────────────────────────────────────────
export const SERVICES = [
  {
    slug: "inpatient",
    icon: "/icons/inpatient.png",
    title: "In-Patient Services",
    image: "/images/inpatient.png",
    shortDesc:
      "Round-the-clock ward care with dedicated nursing and physician oversight.",
    fullDesc:
      "Our in-patient wards offer comprehensive care across general medicine, surgery, obstetrics, and paediatrics. Each ward is staffed 24/7 by trained nurses and overseen by consultant physicians, ensuring continuous monitoring and support for every admitted patient.",
    features: [
      "24/7 nursing care",
      "Consultant oversight",
      "Private & shared wards",
      "Family visiting hours",
    ],
  },
  {
    slug: "nutrition",
    icon: "/icons/nutrition.png",
    title: "Nutrition & Food Rehabilitation",
    image: "/images/nutrition.jpg",
    shortDesc:
      "Personalised dietary advice and meal planning for optimal health.",
    fullDesc:
      "Our nutrition unit promotes health and prevents disease through healthy dietary practices and nutrition education. Using diet therapy to manage illness and support rehabilitation, our dietitians work alongside clinical teams to help patients make informed food and lifestyle choices •	 with a particular focus on diabetes, hypertension, malnutrition and anaemia.",
    features: [
      "Diet therapy for diabetes & hypertension",
      "Malnutrition assessment & rehabilitation",
      "Nutrition education & counselling",
      "Maternal & child nutrition at RCH",
    ],
  },
  {
    slug: "laboratory",
    icon: "/icons/lab.png",
    title: "Laboratory",
    image: "/images/lab.jpeg",
    shortDesc:
      "State-of-the-art diagnostics with rapid turnaround for accurate results.",
    fullDesc:
      "The SECH Laboratory is equipped with modern analysers for haematology, biochemistry, microbiology, and histopathology. Our certified scientists ensure rapid, accurate results that power clinical decision-making.",
    features: [
      "Haematology & biochemistry",
      "Microbiology cultures",
      "HIV/TB testing",
      "Same-day results",
    ],
  },
  {
    slug: "eye-center",
    icon: "/icons/eye.png",
    title: "Eye Center",
    image: "/images/eye.png",
    shortDesc:
      "Full ophthalmic services from routine screening to surgical interventions.",
    fullDesc:
      "The SECH Eye Center provides comprehensive eye care including refraction, cataract surgery, glaucoma management, and diabetic retinopathy screening. We serve patients across the Ahafo Region and beyond.",
    features: [
      "Cataract surgery",
      "Glaucoma screening",
      "Diabetic eye care",
      "Spectacle prescription",
    ],
  },
  {
    slug: "postnatal",
    icon: "/icons/postnatal.png",
    title: "Post-Natal & CWC",
    image: "/images/postnatal.png",
    shortDesc:
      "Mother and child wellness from delivery through early development.",
    fullDesc:
      "Our post-natal and Child Welfare Clinic (CWC) supports mothers and infants through the critical first months. Services include breastfeeding support, immunisation, growth monitoring, and nutritional counselling.",
    features: [
      "Breastfeeding support",
      "Immunisation schedule",
      "Growth monitoring",
      "Nutritional counselling",
    ],
  },

  {
    slug: "ENT",
    icon: "/icons/ent.png",
    title: "Ear, Nose & Throat Services",
    image: "/images/ent.png",
    shortDesc: "Specialised care for ear, nose, and throat conditions.",
    fullDesc:
      "The SECH ENT department provides comprehensive care for a wide range of ear, nose, and throat conditions. Our specialists offer both medical and surgical interventions to ensure optimal patient outcomes.",
    features: [
      "Hearing assessment",
      "Tonsillectomy",
      "Nose surgery",
      "Throat examination",
    ],
  },
  {
    slug: "dental",
    icon: "/icons/tooth.png",
    title: "Dental Services",
    image: "/images/dental.png",
    shortDesc:
      "Preventive, restorative, and cosmetic dental care for all ages.",
    fullDesc:
      "SECH's dental clinic offers a full range of oral health services, from routine cleanings and fillings to extractions and dentures. School health dental outreach programmes extend our care to the wider community.",
    features: [
      "Dental cleaning",
      "Fillings & extractions",
      "Dentures",
      "School health outreach",
    ],
  },
  {
    slug: "psychiatry",
    icon: "/icons/mental.png",
    title: "Psychiatry & Counselling",
    image: "/images/psychiatry.jpeg",
    shortDesc:
      "Mental health support, counselling, and inpatient psychiatric care.",
    fullDesc:
      "The SECH Psychiatry department provides outpatient mental health consultations, group therapy, individual counselling, and inpatient care for acute psychiatric conditions. Our team takes a holistic, compassionate approach.",
    features: [
      "Outpatient consultations",
      "Group therapy",
      "Individual counselling",
      "Inpatient stabilisation",
    ],
  },
  {
    slug: "cwc",
    icon: "/icons/cwc.png",
    title: "Child Welfare Clinic (CWC)",
    image: "/images/cwc.jpg",
    shortDesc:
      "Comprehensive child health services from immunisation to growth monitoring.",
    fullDesc:
      "Our Child Welfare Clinic (CWC) provides essential health services for children under five, including immunisations, growth monitoring, nutritional counselling, and early childhood development support.",
    features: [
      "Immunisation schedule",
      "Growth monitoring",
      "Nutritional counselling",
      "Early childhood support",
    ],
  },
  {
    slug: "pharmacy",
    icon: "/icons/pharm.png",
    title: "Pharmacy",
    image: "/images/pharm.jpeg",
    shortDesc:
      "On-site dispensary stocked with essential and specialised medications.",
    fullDesc:
      "SECH's pharmacy is fully stocked with WHO essential medicines and a wide range of specialised drugs. Our pharmacists provide medication counselling and ensure safe dispensing for both in-patients and out-patients.",
    features: [
      "Essential medicines",
      "Specialised drugs",
      "Medication counselling",
      "Discharge prescriptions",
    ],
  },

  {
    slug: "x-ray",
    icon: "/icons/x-ray.png",
    title: "X-Ray",
    image: "/images/x-ray.png",
    shortDesc: "Digital X-ray services for accurate diagnostics.",
    fullDesc:
      "Our X-Ray department provides high-quality digital X-ray imaging for a wide range of clinical applications, ensuring fast and reliable results for healthcare providers.",
    features: ["Digital X-ray", "Chest X-ray", "Limb X-ray", "Abdominal X-ray"],
  },
  {
    slug: "OPG",
    icon: "/icons/dental-xray.png",
    title: "Dental X-Ray (OPG)",
    image: "/images/dental-xray.png",
    shortDesc:
      "Specialised dental imaging for comprehensive oral health assessment.",
    fullDesc:
      "SECH's dental X-ray services include panoramic (OPG) imaging, bitewing, and periapical X-rays, providing essential diagnostic information for dental care planning and treatment.",
    features: [
      "Panoramic OPG",
      "Bitewing X-ray",
      "Periapical X-ray",
      "Oral health assessment",
    ],
  },
  {
    slug: "ultrasound",
    icon: "/icons/ultrasound.png",
    title: "Ultrasound Scan",
    image: "/images/ultrasound.png",
    shortDesc:
      "Comprehensive ultrasound services for obstetric and general imaging.",
    fullDesc:
      "SECH's ultrasound department offers a full range of diagnostic imaging services, including obstetric ultrasounds, abdominal scans, and musculoskeletal imaging, using state-of-the-art equipment.",
    features: [
      "Obstetric ultrasound",
      "Abdominal scan",
      "Musculoskeletal imaging",
      "Doppler studies",
    ],
  },
  {
    slug: "ecg",
    icon: "/icons/ecg.png",
    title: "Electrocardiogram (ECG)",
    image: "/images/ecg.png",
    shortDesc: "ECG services for cardiac assessment and monitoring.",
    fullDesc:
      "Our ECG department provides comprehensive electrocardiogram services for cardiac assessment, including resting ECGs, stress tests, and Holter monitoring, to support accurate diagnosis and management of heart conditions.",
    features: [
      "Resting ECG",
      "Stress test",
      "Holter monitoring",
      "Cardiac assessment",
    ],
  },
  {
    slug: "outpatient",
    icon: "/icons/outpatient.png",
    image: "/images/opd.jpg",
    title: "Out-Patient Services",
    shortDesc:
      "General consultations and specialist clinics without admission.",
    fullDesc:
      "Our busy Out-Patient Department (OPD) sees hundreds of patients daily across general medicine, paediatrics, and speciality clinics. Triage nursing ensures urgent cases are prioritised immediately.",
    features: [
      "General medicine",
      "Paediatric clinic",
      "Triage nursing",
      "Referral coordination",
    ],
  },
  {
    slug: "antenatal",
    icon: "/icons/antenatal.png",
    title: "Ante-Natal Care",
    image: "/images/antenatal.png",
    shortDesc:
      "Safe, supportive pregnancy care from first trimester to delivery.",
    fullDesc:
      "SECH's Ante-Natal Clinic (ANC) provides regular check-ups, ultrasound scans, iron supplementation, malaria prophylaxis, and birth preparedness education, ensuring every pregnancy in our care is well-monitored.",
    features: [
      "Routine ANC visits",
      "Obstetric ultrasound",
      "Malaria prophylaxis",
      "Birth preparedness",
    ],
  },
];

// ─── Departments (for appointment booking) ────────────────────
export const DEPARTMENTS = [
  "General Medicine",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "Surgery",
  "Eye Center (Ophthalmology)",
  "Dental",
  "Psychiatry & Counselling",
  "Ante-Natal Clinic",
  "Physiotherapy",
  "Nutrition & Dietetics",
];

// ─── Hero carousel slides ─────────────────────────────────────
export const HERO_SLIDES = [
  {
    heading: "Healing with\nFaith & Excellence",
    sub: "World-class Catholic healthcare in the heart of Ghana. Compassionate care for every soul.",
    cta: "Explore Our Services",
    ctaHref: "/services",
    bg: "#063328",
    accent: "#E8B84B",
    pattern: "cross",
  },
  {
    heading: "Your Health\nIs Our Mission",
    sub: "From emergency care to specialised treatments • St. Elizabeth is with you at every step.",
    cta: "Meet Our Story",
    ctaHref: "/about",
    bg: "#0A4F3C",
    accent: "#5DCAA5",
    pattern: "wave",
  },
  {
    heading: "Advanced Care,\nHuman Touch",
    sub: "Modern diagnostics, experienced clinicians, and a healing environment rooted in compassion.",
    cta: "Book Appointment",
    ctaHref: "/appointment",
    bg: "#1A2F2A",
    accent: "#E8B84B",
    pattern: "dots",
  },
];

// ─── Stats ────────────────────────────────────────────────────
// Source: SECH Annual Report 2025. Clinic opened 3 Dec 1956; bed complement
// 100; 99,274 outpatient attendances in 2025; 441 staff at year end.
export const STATS = [
  { value: "70+", label: "Years of Service" },
  { value: "100+", label: "Beds" },
  { value: "99k+", label: "OPD annual visits" },
  { value: "440+", label: "Staff Members" },
];

// ─── News ─────────────────────────────────────────────────────
export const NEWS = [
  {
    slug: "community-health-outreach-2026",
    date: "May 2026",
    tag: "Event",
    title: "Annual Community Health Outreach Drive",
    image: "/images/aeriel.jpg",
    excerpt:
      "Free screenings and health education for over 2,000 residents across the Tano North District.",
    body: "St. Elizabeth Catholic Hospital held its annual Community Health Outreach Drive in May 2026, reaching over 2,000 residents across five communities in the Tano North District. Services included free blood pressure screening, blood glucose testing, eye examinations, and health education talks on malaria prevention, maternal health, and nutrition.",
  },
  {
    slug: "breastfeeding-campaign",
    date: "Apr 2026",
    tag: "Health",
    title: "Breastfeeding Awareness Campaign",
    image: "/images/mat.jpeg",
    excerpt:
      "SECH leads regional initiative promoting exclusive breastfeeding for optimal newborn nutrition.",
    body: "In partnership with regional health directorates, SECH launched an intensive breastfeeding awareness campaign targeting new mothers and community health workers across the Ahafo Region. The campaign emphasises the WHO-recommended six months of exclusive breastfeeding and provides practical support through peer counsellors.",
  },
  {
    slug: "eye-center-equipment",
    date: "Mar 2026",
    tag: "News",
    title: "New Eye Center Equipment Installed",
    image: "/images/dental.png",
    excerpt:
      "A donation from international partners equips our Eye Center with advanced slit-lamp technology.",
    body: "Thanks to a generous donation from Orbis International and the International Eye Foundation, SECH's Eye Center has received a new digital slit-lamp, a non-contact tonometer, and a portable fundus camera. This equipment significantly expands our capacity to diagnose and manage glaucoma, cataracts, and diabetic eye disease.",
  },
  {
    slug: "chag-visit-2025",
    date: "Dec 2025",
    tag: "Event",
    title: "CHAG Executive Director & British High Commissioner Visit",
    image: "/images/eye.png",
    excerpt:
      "Senior officials toured SECH facilities and praised the hospital's community health impact.",
    body: "The Executive Director of the Christian Health Association of Ghana (CHAG) and the Deputy British High Commissioner visited St. Elizabeth Catholic Hospital in December 2025. They toured key departments, met with staff, and commended the hospital's sustained commitment to quality care and community health in rural Ghana.",
  },
];

// ─── Team ─────────────────────────────────────────────────────
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  dept: string;
  initials: string;
  image: string;
  /** Omit any of these and the card falls back to the hospital's own line. */
  linkedin?: string;
  email?: string;
  phone?: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Sr. Georgina Lawrentia Quayson",
    role: "Hospital Manager",
    dept: "Administration",
    initials: "GLQ",
    image:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    linkedin: "https://linkedin.com/in/kwame",
    id: 1,
  },
  {
    name: "Dr. Kofi Kofo Boakye",
    role: "AG. Medical Director",
    dept: "General Medicine",
    initials: "KKB",
    image:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    linkedin: "https://linkedin.com/in/kwame",
    id: 2,
  },
  {
    name: "Mrs. Gladys Bediako",
    role: "Nurse Manager",
    dept: "Administration",
    initials: "GB",
    image:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    linkedin: "https://linkedin.com/in/kwame",
    id: 3,
  },
  {
    name: "Rev.Fr. Mathew Kumi",
    role: "Chaplain ",
    dept: "Administration",
    initials: "MK",
    image:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    linkedin: "https://linkedin.com/in/kwame",
    id: 4,
  },
];

// Dashboard photo gallery
export const PHOTOS = [
  {
    id: 1,
    label: "Modern Ward Facilities",
    caption:
      "Our in-patient wards are equipped with modern beds, monitoring systems, and round-the-clock nursing care.",
    color: "#0A4F3C",
    icon: "/svgs/hospital.svg",
    image: "/images/aeriel.jpg",
    pattern: "cross",
    accent: "#E8B84B",
  },
  {
    id: 2,
    label: "State-of-the-Art Laboratory",
    caption:
      "Advanced diagnostic equipment enables rapid, accurate results to guide clinical decisions.",
    color: "#063328",
    icon: "/svgs/lab.svg",
    image: "/images/lab.jpeg",
    pattern: "dots",
    accent: "#5DCAA5",
  },
  {
    id: 3,
    label: "Eye Center & Ophthalmology",
    caption:
      "Our Eye Center offers comprehensive ophthalmic services from routine screening to cataract surgery.",
    color: "#1A2F2A",
    icon: "/svgs/eye_clinic.svg",
    image: "/images/eye.png",
    pattern: "wave",
    accent: "#E8B84B",
  },
  {
    id: 4,
    label: "Maternity & Post-Natal Care",
    caption:
      "A dedicated, warm environment for mothers and newborns • from delivery through early childhood wellness.",
    color: "#0D3D2C",
    icon: "/svgs/pregnancy.svg",
    image: "/images/mat.jpeg",
    pattern: "cross",
    accent: "#F5D080",
  },
  {
    id: 5,
    label: "Pharmacy & Dispensary",
    caption:
      "Fully stocked with WHO essential medicines and specialised drugs, with expert pharmacist counselling.",
    color: "#0A4F3C",
    icon: "💊",
    image: "/images/pharm.jpeg",
    pattern: "dots",
    accent: "#5DCAA5",
  },
  {
    id: 6,
    label: "Outpatient & Emergency",
    caption:
      "Our 24/7 emergency department and busy OPD serve hundreds of patients daily with expert triage.",
    color: "#1A2F2A",
    icon: "🚑",
    image:
      "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80",
    pattern: "wave",
    accent: "#E8B84B",
  },
];
// ─── Departments Grid Data (For Services Page) ────────────────────
export const DEPARTMENT_GRID_DATA = [
  {
    key: "general",
    badge: "General Services",
    title: "General Services",
    subtitle: "Core daily healthcare for every patient",
    featured: false,
    services: [
      "Out-Patient Services",
      "In-Patient Services",
      "24-Hour Emergency Services",
      "Child Welfare Clinic (CWC)",
      "Psychiatry Services",
      "Dietherapy Services",
      "ANC Services",
      "Wellness Clinic",
      "Reproductive & Child Health",
      "Pharmacy Services",
      "Counselling / ART Services",
      "Mortuary Services",
    ],
    headerStyle: { background: "#0A4F3C" },
    badgeStyle: {
      background: "rgba(93,202,165,0.15)",
      color: "#5DCAA5",
      border: "1px solid rgba(93,202,165,0.3)",
    },
    dotColor: "#5DCAA5",
    iconColor: "#5DCAA5",
    icon: "/svgs/hospital.svg",
    // Light-toned artwork: darkened at render so it reads on the light plate.
    // Drop this to "dark" once a darker mark replaces it.
    iconTone: "light",
  },
  {
    key: "specialist",
    badge: "Specialist Services",
    title: "Specialist Services",
    subtitle: "Expert clinical care by specialty",
    featured: true,
    featuredLabel: "Featured",
    services: [
      "Eye",
      "Ear, Nose & Throat",
      "Dental & Maxillofacial Surgery",
      "Family Medicine",
      "Obstetrics & Gynaecology (Maternal)",
      "General Surgery",
      "Physiotherapy",
      "Pediatric (Child Health)",
      "Restorative Dentistry",
      "Urology",
    ],
    headerStyle: { background: "#063328" },
    badgeStyle: {
      background: "rgba(232,184,75,0.15)",
      color: "#E8B84B",
      border: "1px solid rgba(232,184,75,0.3)",
    },
    dotColor: "#E8B84B",
    iconColor: "#E8B84B",
    icon: "/svgs/consulting.svg",
    iconTone: "light",
  },
  {
    key: "diagnostic",
    badge: "Diagnostic Services",
    title: "Diagnostic Services",
    subtitle: "Precision imaging & non-invasive tests",
    featured: false,
    services: [
      "Digital X-Ray",
      "Ultrasound Scan",
      "Electrocardiogram (ECG)",
      "Dental X-Ray (OPG)",
    ],
    headerStyle: { background: "#0A4F3C" },
    badgeStyle: {
      background: "rgba(93,202,165,0.15)",
      color: "#5DCAA5",
      border: "1px solid rgba(93,202,165,0.3)",
    },
    dotColor: "#5DCAA5",
    iconColor: "#5DCAA5",
    icon: "/svgs/diagnostics.svg",
    iconTone: "dark",
  },
  {
    key: "laboratory",
    badge: "Laboratory Services",
    title: "Laboratory Services",
    subtitle: "Advanced diagnostics & scientific analysis",
    featured: false,
    services: [
      "Haematology",
      "Microbiology",
      "Biochemistry",
      "Transfusion Services",
      "Endocrinology",
      "Immunology",
    ],
    headerStyle: { background: "#1A2F2A" },
    badgeStyle: {
      background: "rgba(245,208,128,0.15)",
      color: "#F5D080",
      border: "1px solid rgba(245,208,128,0.3)",
    },
    dotColor: "#F5D080",
    iconColor: "#F5D080",
    icon: "/svgs/lab.svg",
    iconTone: "dark",
  },
] as const;
