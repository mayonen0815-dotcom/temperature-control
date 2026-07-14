import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "月の指定が不正です" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(y, m - 1, 1));
  const rangeEnd = new Date(Date.UTC(y, m, 0)); // 月末日

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });
  if (!store) return NextResponse.json({ error: "not found" }, { status: 404 });

  const equipments = await prisma.equipment.findMany({
    where: { storeId: params.storeId },
    orderBy: { sortOrder: "asc" },
  });

  const temperatureLogs = await prisma.temperatureLog.findMany({
    where: { storeId: params.storeId, logDate: { gte: rangeStart, lte: rangeEnd } },
  });

  const checklistGroups = await prisma.checklistGroup.findMany({
    where: { storeId: params.storeId },
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const allItemIds = checklistGroups.flatMap((g) => g.items.map((i) => i.id));

  const checklistAnswers = await prisma.checklistAnswer.findMany({
    where: { itemId: { in: allItemIds }, logDate: { gte: rangeStart, lte: rangeEnd } },
  });

  const checklistSubmissions = await prisma.checklistSubmission.findMany({
    where: { storeId: params.storeId, logDate: { gte: rangeStart, lte: rangeEnd } },
  });

  const daysInMonth = rangeEnd.getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    new Date(Date.UTC(y, m - 1, i + 1)).toISOString().slice(0, 10)
  );

  return NextResponse.json({
    store: { id: store.id, name: store.name, storeCode: store.storeCode },
    days,
    equipments: equipments.map((e) => ({ id: e.id, name: e.name })),
    temperatureLogs: temperatureLogs.map((l) => ({
      equipmentId: l.equipmentId,
      logDate: l.logDate.toISOString().slice(0, 10),
      period: l.period,
      value: l.value,
      isAbnormal: l.isAbnormal,
    })),
    checklistGroups: checklistGroups.map((g) => ({
      id: g.id,
      name: g.name,
      items: g.items.map((i) => ({ id: i.id, name: i.name })),
    })),
    checklistAnswers: checklistAnswers.map((a) => ({
      itemId: a.itemId,
      logDate: a.logDate.toISOString().slice(0, 10),
      passed: a.passed,
    })),
    checklistSubmissions: checklistSubmissions.map((s) => ({
      logDate: s.logDate.toISOString().slice(0, 10),
      staffCondition: s.staffCondition,
      absenceNote: s.absenceNote,
      confirmedBy: s.confirmedBy,
    })),
  });
}
