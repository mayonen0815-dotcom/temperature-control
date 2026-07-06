import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const equipments = await prisma.equipment.findMany({
    where: { storeId: params.storeId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ equipments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, minTemp, maxTemp } = await req.json();
  if (!name || minTemp === undefined || maxTemp === undefined) {
    return NextResponse.json(
      { error: "設備名・基準温度（最小/最大）を入力してください" },
      { status: 400 }
    );
  }

  const count = await prisma.equipment.count({ where: { storeId: params.storeId } });

  const equipment = await prisma.equipment.create({
    data: {
      storeId: params.storeId,
      name: String(name).trim(),
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
      sortOrder: count,
    },
  });

  return NextResponse.json({ ok: true, equipment });
}
