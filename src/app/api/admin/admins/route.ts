import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { hashSecret } from "@/lib/password";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admins = await prisma.adminUser.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    admins: admins.map((a) => ({ id: a.id, name: a.name })),
  });
}

const DEFAULT_PASSWORD = "umami2026!";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, password } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "その名前は既に使われています" }, { status: 409 });
  }

  const admin = await prisma.adminUser.create({
    data: {
      name: String(name).trim(),
      passwordHash: hashSecret(String(password || DEFAULT_PASSWORD)),
    },
  });

  // アカウント名と同じ店舗が無ければ、店舗としても作成する（従業員管理・退職者に反映される）
  const existingStore = await prisma.store.findFirst({ where: { name: admin.name } });
  if (!existingStore) {
    const storeCode = `STORE-${Date.now().toString(36).toUpperCase()}`;
    await prisma.store.create({
      data: { storeCode, name: admin.name },
    });
  }

  return NextResponse.json({ ok: true, admin: { id: admin.id, name: admin.name } });
}
