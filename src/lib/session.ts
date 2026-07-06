import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

export type StoreSession = {
  type: "store";
  storeId: string;
  storeCode: string;
  storeName: string;
  staffName: string;
};

export type AdminSession = {
  type: "admin";
  adminId: string;
  name: string;
};

export type Session = StoreSession | AdminSession;

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

const STORE_COOKIE = "genba_store_session";
const ADMIN_COOKIE = "genba_admin_session";

export async function setStoreSession(session: StoreSession) {
  const c = await cookies();
  c.set(STORE_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12時間
  });
}

export async function setAdminSession(session: AdminSession) {
  const c = await cookies();
  c.set(ADMIN_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getStoreSession(): Promise<StoreSession | null> {
  const c = await cookies();
  const session = decodeSession(c.get(STORE_COOKIE)?.value);
  return session?.type === "store" ? session : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const c = await cookies();
  const session = decodeSession(c.get(ADMIN_COOKIE)?.value);
  return session?.type === "admin" ? session : null;
}

export async function clearStoreSession() {
  const c = await cookies();
  c.delete(STORE_COOKIE);
}

export async function clearAdminSession() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}
