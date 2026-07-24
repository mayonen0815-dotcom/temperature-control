import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { storeId: params.storeId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employees });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, address, hireDate, resignDate, note } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "氏名を入力してください" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: {
      storeId: params.storeId,
      name: String(name).trim(),
      address: address ? String(address).trim() : null,
      hireDate: hireDate ? new Date(hireDate) : null,
      resignDate: resignDate ? new Date(resignDate) : null,
      note: note ? String(note).trim() : null,
    },
  });

  return NextResponse.json({ ok: true, employee });
}
