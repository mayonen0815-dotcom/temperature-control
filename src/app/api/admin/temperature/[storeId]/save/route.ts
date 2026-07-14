import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { normalizeDateJst } from "@/lib/date";

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, period, entries, submit } = await req.json();
  const logDate = normalizeDateJst(date ? new Date(date) : new Date());
  const p = period === "PM" ? "PM" : "AM";

  const equipments = await prisma.equipment.findMany({
    where: { storeId: params.storeId, id: { in: (entries ?? []).map((e: any) => e.equipmentId) } },
  });
  const equipmentMap = new Map(equipments.map((e) => [e.id, e]));

  await Promise.all(
    (entries ?? [])
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
            staffName: `${session.name}（事務所代筆）`,
            editedByAdmin: true,
          },
          create: {
            storeId: params.storeId,
            equipmentId: e.equipmentId,
            logDate,
            period: p,
            value,
            note: e.note ?? "",
            isAbnormal,
            staffName: `${session.name}（事務所代筆）`,
            editedByAdmin: true,
          },
        });
      })
  );

  if (submit) {
    await prisma.temperatureSubmission.upsert({
      where: { storeId_logDate_period: { storeId: params.storeId, logDate, period: p } },
      update: {
        submittedBy: `${session.name}（事務所代筆）`,
        submittedByAdmin: true,
        submittedAt: new Date(),
      },
      create: {
        storeId: params.storeId,
        logDate,
        period: p,
        submittedBy: `${session.name}（事務所代筆）`,
        submittedByAdmin: true,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, period } = await req.json();
  const logDate = normalizeDateJst(date ? new Date(date) : new Date());
  const p = period === "PM" ? "PM" : "AM";

  await prisma.temperatureLog.deleteMany({
    where: { storeId: params.storeId, logDate, period: p },
  });

  await prisma.temperatureSubmission.deleteMany({
    where: { storeId: params.storeId, logDate, period: p },
  });

  return NextResponse.json({ ok: true });
}
