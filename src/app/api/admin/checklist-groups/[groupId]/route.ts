import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, active } = await req.json();
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (active !== undefined) data.active = active;

  const group = await prisma.checklistGroup.update({ where: { id: params.groupId }, data });
  return NextResponse.json({ ok: true, group });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.checklistGroup.update({ where: { id: params.groupId }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
