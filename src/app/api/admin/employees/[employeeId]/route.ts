import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, address, hireDate, resignDate, note } = await req.json();
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (address !== undefined) data.address = address || null;
  if (hireDate !== undefined) data.hireDate = hireDate ? new Date(hireDate) : null;
  if (resignDate !== undefined) data.resignDate = resignDate ? new Date(resignDate) : null;
  if (note !== undefined) data.note = note || null;

  const employee = await prisma.employee.update({
    where: { id: params.employeeId },
    data,
  });
  return NextResponse.json({ ok: true, employee });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.employee.delete({ where: { id: params.employeeId } });
  return NextResponse.json({ ok: true });
}
