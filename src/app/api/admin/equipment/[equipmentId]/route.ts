import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { equipmentId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, minTemp, maxTemp, active } = await req.json();
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (minTemp !== undefined) data.minTemp = Number(minTemp);
  if (maxTemp !== undefined) data.maxTemp = Number(maxTemp);
  if (active !== undefined) data.active = active;

  const equipment = await prisma.equipment.update({
    where: { id: params.equipmentId },
    data,
  });
  return NextResponse.json({ ok: true, equipment });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { equipmentId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.equipment.update({
    where: { id: params.equipmentId },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
