// Hidden identifiers (SSNIT, CAGD staff ID, licence PIN, Ghana Card, bank
// accounts) come from WordPress masked, like "••••6789". Showing one in full
// needs the person's own reveal PIN; see section 14c of the sech-portal plugin.

export const SECRET_FIELDS = ["ssnit", "cagdStaffId", "licencePin", "ghanaCard", "gmoneyAccount", "gcbAccount"] as const;
export type SecretField = (typeof SECRET_FIELDS)[number];

export const isSecretField = (f: string): f is SecretField => (SECRET_FIELDS as readonly string[]).includes(f);
/** true for a value WordPress has masked */
export const isMasked = (v: string | null | undefined) => !!v && v.includes("•");

export type RevealCode = "PIN_NOT_SET" | "PIN_REQUIRED" | "PIN_WRONG" | "PIN_LOCKED" | "PIN_INVALID";
