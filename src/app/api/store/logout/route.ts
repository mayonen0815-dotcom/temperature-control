import { NextResponse } from "next/server";
import { clearStoreSession } from "@/lib/session";

export async function POST() {
  await clearStoreSession();
  return NextResponse.json({ ok: true });
}
