import { TEAM } from "@/lib/data";

/**
 * Organogram of the Goaso Diocesan Health Service.
 *
 * Transcribed from the official diocesan chart. This tree is the single source
 * of truth for the organogram page — adding, moving or renaming a post is an
 * edit here, not a change to the renderer.
 */

export type OrgCategory =
  | "governance"
  | "medical"
  | "chaplaincy"
  | "administration"
  | "nursing"
  | "audit";

export interface OrgNode {
  /** Stable id — drives expand/collapse state, so keep it if a label changes. */
  id: string;
  label: string;
  category: OrgCategory;
  /** Matches a TEAM[].role so the chart can name the current post-holder. */
  roleKey?: string;
  /** Reports outside the direct line hierarchy; rendered with a dashed link. */
  dotted?: boolean;
  children?: OrgNode[];
}

export const ORG_CATEGORY_META: Record<
  OrgCategory,
  { label: string; line: string; border: string; bg: string; text: string }
> = {
  governance:     { label: "Governance",      line: "#1565C0", border: "#1565C0", bg: "#F4F8FE", text: "#0D2B5E" },
  medical:        { label: "Medical",         line: "#C62828", border: "#C62828", bg: "#FDF5F5", text: "#8E1B1B" },
  chaplaincy:     { label: "Chaplaincy",      line: "#C8960C", border: "#C8960C", bg: "#FEFAF0", text: "#6B4E00" },
  administration: { label: "Administration",  line: "#1565C0", border: "#1565C0", bg: "#F4F8FE", text: "#0D2B5E" },
  nursing:        { label: "Nursing",         line: "#6A1B9A", border: "#6A1B9A", bg: "#FAF5FD", text: "#4A148C" },
  audit:          { label: "Internal Audit",  line: "#C62828", border: "#C62828", bg: "#FDF5F5", text: "#8E1B1B" },
};

const medicalDirector: OrgNode = {
  id: "medical-director",
  label: "Medical Director",
  category: "medical",
  roleKey: "AG. Medical Director",
  children: [
    {
      id: "clinical-coordinator",
      label: "Clinical Coordinator",
      category: "medical",
      children: [
        {
          id: "medical-officer",
          label: "Medical Officer",
          category: "medical",
          children: [
            { id: "physician-assistant", label: "Physician Assistant", category: "medical" },
          ],
        },
      ],
    },
    {
      id: "specialist",
      label: "Specialist",
      category: "medical",
      children: [{ id: "house-officer", label: "House Officer", category: "medical" }],
    },
    { id: "pharmacy", label: "Pharmacy", category: "medical" },
    { id: "diagnostics", label: "Diagnostics", category: "medical" },
    { id: "anaesthesia", label: "Anaesthesia", category: "medical" },
    { id: "physiotherapy", label: "Physiotherapy", category: "medical" },
    { id: "medical-records", label: "Medical Records", category: "medical" },
    {
      id: "public-health",
      label: "Public Health",
      category: "medical",
      children: [
        { id: "nutrition", label: "Nutrition", category: "medical" },
        { id: "special-clinics", label: "Special Clinics", category: "medical" },
      ],
    },
  ],
};

const chaplain: OrgNode = {
  id: "chaplain",
  label: "Chaplain",
  category: "chaplaincy",
  roleKey: "Chaplain",
  children: [
    {
      id: "counselling-pastoral-care",
      label: "Counselling & Pastoral Care",
      category: "chaplaincy",
    },
  ],
};

const administrator: OrgNode = {
  id: "administrator",
  label: "Administrator",
  category: "administration",
  children: [
    { id: "hr-manager", label: "H.R. Manager", category: "administration" },
    { id: "accounts-claims", label: "Accounts / Claims", category: "administration" },
    { id: "admin-staff", label: "Admin. Staff", category: "administration" },
    { id: "transport", label: "Transport", category: "administration" },
    { id: "plants-grounds", label: "Plants & Grounds", category: "administration" },
    { id: "estates-maintenance", label: "Estates & Maintenance", category: "administration" },
    { id: "sewing-unit", label: "Sewing Unit", category: "administration" },
    { id: "security", label: "Security", category: "administration" },
    { id: "mortuary", label: "Mortuary", category: "administration" },
    { id: "ict", label: "I.C.T.", category: "administration" },
    { id: "laundry", label: "Laundry", category: "administration" },
    { id: "environmental-health", label: "Environmental Health", category: "administration" },
    { id: "stores-procurement", label: "Stores & Procurement", category: "administration" },
    { id: "other-supporting-staff", label: "Other Supporting Staff", category: "administration" },
    { id: "quality-manager", label: "Quality Manager", category: "administration" },
  ],
};

const nurseManager: OrgNode = {
  id: "nurse-manager",
  label: "Nurse Manager",
  category: "nursing",
  roleKey: "Nurse Manager",
  children: [
    { id: "nurse-specialist", label: "Nurse Specialist", category: "nursing" },
    { id: "nurses", label: "Nurses", category: "nursing" },
    { id: "midwives", label: "Midwives", category: "nursing" },
    { id: "ward-assistant", label: "Ward Assistant", category: "nursing" },
  ],
};

export const ORG_CHART: OrgNode = {
  id: "bishop",
  label: "Bishop of Goaso Diocese",
  category: "governance",
  children: [
    {
      id: "health-service-board",
      label: "Diocesan Health Service Board",
      category: "governance",
      children: [
        {
          id: "director-health-service",
          label: "Director of Health Service",
          category: "governance",
          children: [
            {
              id: "hospital-manager",
              label: "Hospital Manager",
              category: "governance",
              roleKey: "Hospital Manager",
              children: [medicalDirector, chaplain, administrator, nurseManager],
            },
            {
              // Drawn on the official chart as a separate line running back up to
              // the Director — internal audit sits outside the management chain
              // so it can report independently.
              id: "internal-auditor",
              label: "Internal Auditor",
              category: "audit",
              dotted: true,
            },
          ],
        },
      ],
    },
  ],
};

/** The person currently holding a post, if the chart node names one. */
export function findPostHolder(roleKey?: string) {
  if (!roleKey) return null;
  const key = roleKey.trim().toLowerCase();
  // TEAM roles carry stray whitespace/prefixes ("Chaplain ", "AG. Medical
  // Director"), so match on the normalised string rather than the label.
  return TEAM.find((m) => m.role.trim().toLowerCase() === key) ?? null;
}

/** Every node id in the tree, depth-first. */
export function collectNodeIds(node: OrgNode, acc: string[] = []): string[] {
  acc.push(node.id);
  node.children?.forEach((c) => collectNodeIds(c, acc));
  return acc;
}

/** Ids of nodes that actually have children — the only ones that can collapse. */
export function collectParentIds(node: OrgNode, acc: string[] = []): string[] {
  if (node.children?.length) {
    acc.push(node.id);
    node.children.forEach((c) => collectParentIds(c, acc));
  }
  return acc;
}

/** Total posts in the chart, for the page summary. */
export function countNodes(node: OrgNode): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) ?? 0);
}
