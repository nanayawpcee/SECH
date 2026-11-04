export type NoticeCategory = "general" | "clinical" | "hr" | "events" | "facilities";
export type NoticePriority = "normal" | "important" | "urgent";

export interface StaffNotice {
  databaseId: number;
  title: string;
  body: string;
  category: NoticeCategory;
  priority: NoticePriority;
  pinned: boolean;
  expiresOn: string | null;
  audience: string | null;
  link: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readCount: number | null;
  publicHeadline: boolean;
}

export interface NoticeHeadline {
  databaseId: number;
  title: string | null;
  category: NoticeCategory;
  priority: NoticePriority;
  pinned: boolean;
  createdAt: string;
}

export const PUBLIC_HEADLINES_QUERY = `
  query NoticeHeadlines {
    staffNoticeHeadlines { databaseId title category priority pinned createdAt }
  }
`;

export const NOTICE_CATEGORIES: { value: NoticeCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "clinical", label: "Clinical" },
  { value: "hr", label: "HR & staff" },
  { value: "events", label: "Events" },
  { value: "facilities", label: "Facilities" },
];

const NOTICE_FIELDS = `
  databaseId title body category priority pinned expiresOn audience link
  authorName createdAt updatedAt isRead readCount publicHeadline
`;

export const STAFF_NOTICES_QUERY = `
  query StaffNotices($includeExpired: Boolean) {
    staffNotices(includeExpired: $includeExpired) { ${NOTICE_FIELDS} }
  }
`;

export const SAVE_NOTICE = `
  mutation SaveNotice(
    $databaseId: Int, $title: String!, $body: String, $category: String,
    $priority: String, $pinned: Boolean, $expiresOn: String, $audience: String,
    $link: String, $resetReads: Boolean, $publicHeadline: Boolean
  ) {
    saveStaffNotice(input: {
      databaseId: $databaseId, title: $title, body: $body, category: $category,
      priority: $priority, pinned: $pinned, expiresOn: $expiresOn, audience: $audience,
      link: $link, resetReads: $resetReads, publicHeadline: $publicHeadline
    }) { notice { ${NOTICE_FIELDS} } }
  }
`;

export const DELETE_NOTICE = `
  mutation DeleteNotice($databaseId: Int!) {
    deleteStaffNotice(input: { databaseId: $databaseId }) { deletedId }
  }
`;

export const MARK_NOTICE_READ = `
  mutation MarkNoticeRead($databaseId: Int!) {
    markStaffNoticeRead(input: { databaseId: $databaseId }) { notice { ${NOTICE_FIELDS} } }
  }
`;

export function isMissingPlugin(message: string) {
  return /Cannot query field "staffNotices"|Cannot query field "saveStaffNotice"|markStaffNoticeRead|deleteStaffNotice/i.test(message);
}

export function noticeVariables(input: Record<string, unknown>, databaseId?: number) {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    databaseId,
    title: String(input.title ?? "").trim(),
    body: str(input.body) ?? "",
    category: str(input.category),
    priority: str(input.priority),
    pinned: input.pinned === true,
    expiresOn: str(input.expiresOn) || "",
    audience: str(input.audience) || "",
    link: str(input.link) || "",
    resetReads: input.resetReads === true,
    publicHeadline: typeof input.publicHeadline === "boolean" ? input.publicHeadline : undefined,
  };
}
