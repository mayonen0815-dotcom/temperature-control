import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

// 「異動」に変更した従業員と同姓同名で、他店舗に在籍中（退社日なし）の候補を探す
export async function GET(
  _req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { id: params.employeeId },
  });
  if (!employee) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }

  const candidates = await prisma.employee.findMany({
    where: {
      name: employee.name,
      storeId: { not: employee.storeId },
      resignDate: null,
    },
    include: { store: true },
  });

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      storeName: c.store.name,
      employmentType: c.employmentType,
    })),
  });
}
