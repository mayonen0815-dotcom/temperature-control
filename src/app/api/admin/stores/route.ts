import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { hashSecret } from "@/lib/password";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stores = await prisma.store.findMany({
    orderBy: { storeCode: "asc" },
    include: { _count: { select: { equipments: true } } },
  });

  return NextResponse.json({
    stores: stores.map((s) => ({
      id: s.id,
      storeCode: s.storeCode,
      name: s.name,
      active: s.active,
      hasPin: !!s.pinHash,
      equipmentCount: s._count.equipments,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { storeCode, name, pin } = await req.json();
  if (!storeCode || !name) {
    return NextResponse.json({ error: "店舗IDと店舗名を入力してください" }, { status: 400 });
  }

  const existing = await prisma.store.findUnique({ where: { storeCode } });
  if (existing) {
    return NextResponse.json({ error: "その店舗IDは既に使われています" }, { status: 409 });
  }

  const store = await prisma.store.create({
    data: {
      storeCode: String(storeCode).trim(),
      name: String(name).trim(),
      pinHash: pin ? hashSecret(String(pin)) : null,
      checklistGroups: {
        create: [
          {
            name: "第1グループ：非加熱のもの",
            sortOrder: 0,
            items: { create: [{ name: "非加熱のもの", sortOrder: 0 }] },
          },
          {
            name: "第2グループ：加熱するもの",
            sortOrder: 1,
            items: {
              create: [
                { name: "加熱するもの", sortOrder: 0 },
                { name: "加熱後に高温保存", sortOrder: 1 },
              ],
            },
          },
          {
            name: "第3グループ：冷蔵するもの",
            sortOrder: 2,
            items: { create: [{ name: "冷蔵するもの", sortOrder: 0 }] },
          },
        ],
      },
    },
  });

  return NextResponse.json({ ok: true, store });
}
