import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySecret } from "@/lib/password";
import { setAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();
  if (!name || !password) {
    return NextResponse.json({ error: "名前とパスワードを入力してください" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findFirst({ where: { name } });
  if (!admin || !verifySecret(password, admin.passwordHash)) {
    return NextResponse.json({ error: "名前またはパスワードが正しくありません" }, { status: 401 });
  }

  await setAdminSession({ type: "admin", adminId: admin.id, name: admin.name });
  return NextResponse.json({ ok: true });
}
