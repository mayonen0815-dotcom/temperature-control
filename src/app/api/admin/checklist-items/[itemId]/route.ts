import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, active, guide } = await req.json();
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (active !== undefined) data.active = active;
  if (guide !== undefined) data.guide = guide;

  const item = await prisma.checklistItem.update({ where: { id: params.itemId }, data });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.checklistItem.update({ where: { id: params.itemId }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
