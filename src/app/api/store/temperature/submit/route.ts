import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSession } from "@/lib/session";
import { normalizeDateJst } from "@/lib/date";

export async function POST(req: NextRequest) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, period } = await req.json();
  const logDate = normalizeDateJst(date ? new Date(date) : new Date());
  const p = period === "PM" ? "PM" : "AM";

  const equipmentCount = await prisma.equipment.count({
    where: { storeId: session.storeId, active: true },
  });
  const logCount = await prisma.temperatureLog.count({
    where: { storeId: session.storeId, logDate, period: p },
  });

  if (equipmentCount > 0 && logCount < equipmentCount) {
    return NextResponse.json(
      { error: "未入力の設備があります。すべての数値を入力してください。" },
      { status: 400 }
    );
  }

  const submission = await prisma.temperatureSubmission.upsert({
    where: { storeId_logDate_period: { storeId: session.storeId, logDate, period: p } },
    update: { submittedBy: session.staffName, submittedByAdmin: false, submittedAt: new Date() },
    create: {
      storeId: session.storeId,
      logDate,
      period: p,
      submittedBy: session.staffName,
    },
  });

  return NextResponse.json({ ok: true, submittedAt: submission.submittedAt });
}
