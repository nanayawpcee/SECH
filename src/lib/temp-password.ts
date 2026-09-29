import "server-only";
import { randomInt } from "node:crypto";

// No 0/O, 1/l/I: these passwords are read aloud or copied from a slip of paper.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/**
 * A one-time password for handing over in person, e.g. "Kq7m-Xa3P-9wtR-h4Ze".
 * 16 characters from 54 symbols ≈ 92 bits — far beyond guessing — from the
 * OS's cryptographic random source. Generated on the server, shown once to
 * the administrator, and never stored by the portal.
 */
export function generateTempPassword(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let s = "";
    for (let i = 0; i < 4; i++) s += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(s);
  }
  return groups.join("-");
}
