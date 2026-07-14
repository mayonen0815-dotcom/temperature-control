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

  const groups = await prisma.checklistGroup.findMany({
    where: { storeId: params.storeId, active: true },
    orderBy: { sortOrder: "asc" },
    include: { items: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });

  const allItemIds = groups.flatMap((g) => g.items.map((i) => i.id));
  const answers = await prisma.checklistAnswer.findMany({
    where: { itemId: { in: allItemIds }, logDate },
  });

  const submission = await prisma.checklistSubmission.findUnique({
    where: { storeId_logDate: { storeId: params.storeId, logDate } },
  });

  const result = groups.map((g) => ({
    id: g.id,
    name: g.name,
    referencePhotoUrl: g.referencePhotoUrl,
    items: g.items.map((it) => {
      const a = answers.find((x) => x.itemId === it.id);
      return {
        id: it.id,
        name: it.name,
        guide: it.guide,
        passed: a?.passed ?? null,
        photoUrl: a?.photoUrl ?? null,
        note: a?.note ?? "",
      };
    }),
  }));

  return NextResponse.json({
    store: { id: store.id, name: store.name, storeCode: store.storeCode },
    groups: result,
    submitted: !!submission,
    staffCondition: submission?.staffCondition ?? "",
    absenceNote: submission?.absenceNote ?? "",
    confirmedBy: submission?.confirmedBy ?? "",
    submittedBy: submission?.submittedBy ?? null,
  });
}
