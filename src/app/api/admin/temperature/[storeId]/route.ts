import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { normalizeDateJst } from "@/lib/date";

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const logDate = normalizeDateJst(dateStr ? new Date(dateStr) : new Date());

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });
  if (!store) return NextResponse.json({ error: "not found" }, { status: 404 });

  const equipments = await prisma.equipment.findMany({
    where: { storeId: params.storeId, active: true },
    orderBy: { sortOrder: "asc" },
  });

  const logs = await prisma.temperatureLog.findMany({
    where: { storeId: params.storeId, logDate },
  });

  const submissions = await prisma.temperatureSubmission.findMany({
    where: { storeId: params.storeId, logDate },
  });

  function buildPeriod(period: "AM" | "PM") {
    const sub = submissions.find((s) => s.period === period);
    return {
      submitted: !!sub,
      submittedBy: sub?.submittedBy ?? null,
      submittedByAdmin: sub?.submittedByAdmin ?? false,
      items: equipments.map((eq) => {
        const log = logs.find((l) => l.equipmentId === eq.id && l.period === period);
        return {
          equipmentId: eq.id,
          name: eq.name,
          minTemp: eq.minTemp,
          maxTemp: eq.maxTemp,
          value: log?.value ?? null,
          note: log?.note ?? "",
          isAbnormal: log?.isAbnormal ?? false,
          editedByAdmin: log?.editedByAdmin ?? false,
        };
      }),
    };
  }

  return NextResponse.json({
    store: { id: store.id, name: store.name, storeCode: store.storeCode },
    date: dateStr,
    AM: buildPeriod("AM"),
    PM: buildPeriod("PM"),
  });
}
