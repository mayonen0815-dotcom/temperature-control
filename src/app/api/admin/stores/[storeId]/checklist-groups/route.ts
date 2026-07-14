import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const groups = await prisma.checklistGroup.findMany({
    where: { storeId: params.storeId, active: true },
    orderBy: { sortOrder: "asc" },
    include: { items: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ groups });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "グループ名を入力してください" }, { status: 400 });

  const count = await prisma.checklistGroup.count({ where: { storeId: params.storeId } });

  const group = await prisma.checklistGroup.create({
    data: { storeId: params.storeId, name: String(name).trim(), sortOrder: count },
  });

  return NextResponse.json({ ok: true, group });
}
