import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySecret } from "@/lib/password";
import { setStoreSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { storeCode, pin, staffName } = await req.json();

  if (!storeCode || !staffName) {
    return NextResponse.json(
      { error: "店舗IDとお名前を入力してください" },
      { status: 400 }
    );
  }

  const store = await prisma.store.findUnique({
    where: { storeCode: String(storeCode).trim() },
  });

  if (!store || !store.active) {
    return NextResponse.json(
      { error: "店舗IDが見つかりません" },
      { status: 404 }
    );
  }

  if (store.pinHash) {
    if (!pin || !verifySecret(String(pin), store.pinHash)) {
      return NextResponse.json(
        { error: "PINが正しくありません" },
        { status: 401 }
      );
    }
  }

  await setStoreSession({
    type: "store",
    storeId: store.id,
    storeCode: store.storeCode,
    storeName: store.name,
    staffName: String(staffName).trim(),
  });

  return NextResponse.json({ ok: true });
}
