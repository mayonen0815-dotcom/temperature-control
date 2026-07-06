import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSession } from "@/lib/session";
import { normalizeDateJst } from "@/lib/date";

export async function GET(req: NextRequest) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const period = searchParams.get("period") === "PM" ? "PM" : "AM";
  const logDate = normalizeDateJst(dateStr ? new Date(dateStr) : new Date());

  const equipments = await prisma.equipment.findMany({
    where: { storeId: session.storeId, active: true },
    orderBy: { sortOrder: "asc" },
  });

  const logs = await prisma.temperatureLog.findMany({
    where: { storeId: session.storeId, logDate, period },
  });

  const submission = await prisma.temperatureSubmission.findUnique({
    where: { storeId_logDate_period: { storeId: session.storeId, logDate, period } },
  });

  const items = equipments.map((eq) => {
    const log = logs.find((l) => l.equipmentId === eq.id);
    return {
      equipmentId: eq.id,
      name: eq.name,
      minTemp: eq.minTemp,
      maxTemp: eq.maxTemp,
      value: log?.value ?? null,
      note: log?.note ?? "",
      isAbnormal: log?.isAbnormal ?? false,
    };
  });

  return NextResponse.json({
    items,
    submitted: !!submission,
    submittedAt: submission?.submittedAt ?? null,
    submittedBy: submission?.submittedBy ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, period, entries } = await req.json();
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "invalid entries" }, { status: 400 });
  }
  const logDate = normalizeDateJst(date ? new Date(date) : new Date());
  const p = period === "PM" ? "PM" : "AM";

  const equipments = await prisma.equipment.findMany({
    where: { storeId: session.storeId, id: { in: entries.map((e: any) => e.equipmentId) } },
  });
  const equipmentMap = new Map(equipments.map((e) => [e.id, e]));

  await Promise.all(
    entries
      .filter((e: any) => e.value !== null && e.value !== "" && e.value !== undefined)
      .map((e: any) => {
        const eq = equipmentMap.get(e.equipmentId);
        if (!eq) return null;
        const value = Number(e.value);
        const isAbnormal = value < eq.minTemp || value > eq.maxTemp;
        return prisma.temperatureLog.upsert({
          where: {
            equipmentId_logDate_period: {
              equipmentId: e.equipmentId,
              logDate,
              period: p,
            },
          },
          update: {
            value,
            note: e.note ?? "",
            isAbnormal,
            staffName: session.staffName,
            editedByAdmin: false,
          },
          create: {
            storeId: session.storeId,
            equipmentId: e.equipmentId,
            logDate,
            period: p,
            value,
            note: e.note ?? "",
            isAbnormal,
            staffName: session.staffName,
          },
        });
      })
  );

  return NextResponse.json({ ok: true });
}
