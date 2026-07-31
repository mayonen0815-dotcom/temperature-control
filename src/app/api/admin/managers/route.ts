import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

// 全店舗の「正社員（マネージャー等）」だけを横断的に集めて返す
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const managers = await prisma.employee.findMany({
    where: {
      employmentType: "正社員（マネージャー等）",
      resignDate: null,
    },
    include: { store: true },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json({
    managers: managers.map((m) => ({
      id: m.id,
      name: m.name,
      address: m.address,
      hireDate: m.hireDate,
      storeId: m.storeId,
      storeName: m.store.name,
    })),
  });
}
