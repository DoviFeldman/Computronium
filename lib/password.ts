/**
 * Anonymous-post edit passwords.
 *
 * When someone posts WITHOUT an account, we generate a random string and
 * show it to them exactly once. Whoever holds that string can edit or
 * delete the post. It's stored as a SHA-256 hash in the `posts` row —
 * not military-grade (no salt, no bcrypt), but plenty for "don't let
 * strangers edit my robot post". The spec explicitly allows this level.
 */
import { createHash, randomBytes } from "crypto";

/** Generate a 24-character password like "k3vq-9dmx-hw72-p1sa-40tz-b8cn". */
export function generateEditPassword(): string {
  // Unambiguous alphabet: no 0/O, 1/l/I look-alikes.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(24);
  let out = "";
  for (let i = 0; i < 24; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i !== 23) out += "-";
  }
  return out;
}

/** Hash a password for storage / comparison. */
export function hashEditPassword(password: string): string {
  return createHash("sha256").update(password.trim()).digest("hex");
}

/** Constant-ish time compare is overkill here; simple equality is fine. */
export function verifyEditPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash || !password) return false;
  return hashEditPassword(password) === storedHash;
}
