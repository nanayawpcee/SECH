export interface Post {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  type: "news" | "blog" | "event" | "announcement";
  author: string;
  date: string;
  /** "pending" = submitted by a staff writer, waiting for an admin to publish. */
  status: "published" | "draft" | "scheduled" | "pending";
  slug: string;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  dept: string;
  type: "consultation" | "followup" | "test";
  date: string;
  time: string;
  insurance: string;
  insuranceNumber?: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export const SAMPLE_POSTS: Post[] = [
  { id:1, title:"Annual Community Health Outreach Drive", excerpt:"Free screenings and health education for over 2,000 residents.", body:"Full article body here...", type:"news", author:"Admin", date:"May 2026", status:"published", slug:"community-health-outreach-2026" },
  { id:2, title:"Breastfeeding Awareness Campaign", excerpt:"SECH leads regional initiative promoting exclusive breastfeeding.", body:"Full article body here...", type:"news", author:"Admin", date:"Apr 2026", status:"published", slug:"breastfeeding-campaign" },
  { id:3, title:"New Eye Center Equipment Installed", excerpt:"Donation from international partners equips our Eye Center.", body:"Full article body here...", type:"news", author:"Admin", date:"Mar 2026", status:"published", slug:"eye-center-equipment" },
  { id:4, title:"5 Tips for Malaria Prevention in Children", excerpt:"Practical advice for families during peak malaria season.", body:"Draft body...", type:"blog", author:"Dr. Mensah", date:"Jun 2026", status:"draft", slug:"malaria-prevention-tips" },
  { id:5, title:"Understanding Diabetes: A Patient Guide", excerpt:"Simple explanations for patients newly diagnosed with Type 2 diabetes.", body:"Full article body here...", type:"blog", author:"Dr. Boateng", date:"May 2026", status:"published", slug:"diabetes-patient-guide" },
  { id:6, title:"CHAG Executive Director Visit", excerpt:"Senior officials praised the hospital's community health impact.", body:"Full article body here...", type:"news", author:"Admin", date:"Dec 2025", status:"published", slug:"chag-visit-2025" },
  { id:7, title:"Mental Health: Breaking the Stigma", excerpt:"Addressing mental health misconceptions in the community.", body:"Full article body here...", type:"blog", author:"Dr. Oppong", date:"Oct 2025", status:"published", slug:"mental-health-stigma" },
  { id:8, title:"2026 Community Immunisation Drive", excerpt:"Annual vaccination campaign reaches 3,000+ children.", body:"Draft...", type:"announcement", author:"Admin", date:"Jun 2026", status:"draft", slug:"immunisation-drive-2026" },
];

export const SAMPLE_BOOKINGS: Booking[] = [
  { id:"BK001", name:"Abena Mensah",    phone:"+233 24 111 2345", email:"abena@example.com",  dept:"Eye Center",          type:"consultation", date:"Jun 5, 2026",  time:"09:00 AM", insurance:"NHIS",    status:"pending",   createdAt:"2026-06-02" },
  { id:"BK002", name:"Kofi Acheampong", phone:"+233 20 987 6543", email:"kofi@example.com",   dept:"General Medicine",    type:"followup",     date:"Jun 5, 2026",  time:"10:30 AM", insurance:"None",    status:"confirmed", createdAt:"2026-06-01" },
  { id:"BK003", name:"Adwoa Boateng",   phone:"+233 55 432 1098", email:"adwoa@example.com",  dept:"Ante-Natal Clinic",   type:"consultation", date:"Jun 6, 2026",  time:"08:00 AM", insurance:"NHIS",    status:"pending",   createdAt:"2026-06-02" },
  { id:"BK004", name:"Yaw Darko",       phone:"+233 27 765 4321", email:"yaw@example.com",    dept:"Dental",              type:"consultation", date:"Jun 7, 2026",  time:"02:00 PM", insurance:"MetLife", status:"confirmed", createdAt:"2026-06-01" },
  { id:"BK005", name:"Akosua Frimpong", phone:"+233 50 111 9876", email:"akosua@example.com", dept:"Psychiatry",          type:"followup",     date:"Jun 8, 2026",  time:"11:00 AM", insurance:"NHIS",    status:"pending",   createdAt:"2026-06-03" },
  { id:"BK006", name:"Kwabena Asante",  phone:"+233 24 333 4567", email:"kwabena@example.com",dept:"Surgery",             type:"test",         date:"Jun 8, 2026",  time:"08:30 AM", insurance:"None",    status:"cancelled", createdAt:"2026-06-01" },
  { id:"BK007", name:"Ama Nyarko",      phone:"+233 20 555 7890", email:"ama@example.com",    dept:"Obstetrics & Gynae",  type:"consultation", date:"Jun 9, 2026",  time:"09:30 AM", insurance:"NHIS",    status:"confirmed", createdAt:"2026-06-02" },
  { id:"BK008", name:"Emmanuel Tetteh", phone:"+233 55 222 3344", email:"",                   dept:"General Medicine",    type:"followup",     date:"Jun 9, 2026",  time:"03:00 PM", insurance:"None",    status:"pending",   createdAt:"2026-06-03" },
];
