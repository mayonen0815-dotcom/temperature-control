import crypto from "crypto";

const ITERATIONS = 100_000;
const KEYLEN = 32;
const DIGEST = "sha256";

export function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(secret, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(secret: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto
    .pbkdf2Sync(secret, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}
