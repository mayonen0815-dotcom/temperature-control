import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, guide } = await req.json();
  if (!name) return NextResponse.json({ error: "項目名を入力してください" }, { status: 400 });

  const count = await prisma.checklistItem.count({ where: { groupId: params.groupId } });

  const item = await prisma.checklistItem.create({
    data: {
      groupId: params.groupId,
      name: String(name).trim(),
      guide: guide ? String(guide).trim() : null,
      sortOrder: count,
    },
  });

  return NextResponse.json({ ok: true, item });
}
