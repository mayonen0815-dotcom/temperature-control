import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { getWeekRange, normalizeDateJst, toISODate } from "@/lib/date";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const anchorStr = searchParams.get("anchor");
  const anchor = normalizeDateJst(anchorStr ? new Date(anchorStr) : new Date());
  const days = getWeekRange(anchor);
  const rangeStart = days[0];
  const rangeEnd = days[6];

  const [stores, submissions, equipmentCounts] = await Promise.all([
    prisma.store.findMany({ where: { active: true }, orderBy: { storeCode: "asc" } }),
    prisma.temperatureSubmission.findMany({
      where: { logDate: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.equipment.groupBy({
      by: ["storeId"],
      where: { active: true },
      _count: { _all: true },
    }),
  ]);

  const equipmentCountMap = new Map(
    equipmentCounts.map((e) => [e.storeId, e._count._all])
  );

  const grid = stores.map((store) => {
    const hasEquipment = (equipmentCountMap.get(store.id) ?? 0) > 0;
    const dayStatuses = days.map((d) => {
      const iso = toISODate(d);
      const am = submissions.some(
        (s) => s.storeId === store.id && toISODate(s.logDate) === iso && s.period === "AM"
      );
      const pm = submissions.some(
        (s) => s.storeId === store.id && toISODate(s.logDate) === iso && s.period === "PM"
      );
      return { date: iso, am, pm, complete: hasEquipment && am && pm };
    });
    return {
      storeId: store.id,
      storeCode: store.storeCode,
      storeName: store.name,
      hasEquipment,
      days: dayStatuses,
    };
  });

  return NextResponse.json({
    days: days.map((d) => toISODate(d)),
    stores: grid,
  });
}
