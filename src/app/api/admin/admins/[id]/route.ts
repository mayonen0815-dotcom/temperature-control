import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (session.adminId === params.id) {
    return NextResponse.json(
      { error: "ログイン中の自分のアカウントは削除できません" },
      { status: 400 }
    );
  }

  const count = await prisma.adminUser.count();
  if (count <= 1) {
    return NextResponse.json(
      { error: "最後の1つのアカウントは削除できません" },
      { status: 400 }
    );
  }

  await prisma.adminUser.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
