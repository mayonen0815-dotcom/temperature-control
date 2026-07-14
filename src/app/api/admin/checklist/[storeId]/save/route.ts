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

  const form = await req.formData();
  const date = String(form.get("date") || "");
  const submit = form.get("submit") === "true";
  const staffCondition = String(form.get("staffCondition") || "");
  const absenceNote = String(form.get("absenceNote") || "");
  const confirmedBy = String(form.get("confirmedBy") || "");
  const answersRaw = String(form.get("answers") || "[]");

  let answers: { itemId: string; passed: boolean | null; note?: string }[] = [];
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    return NextResponse.json({ error: "不正なデータです" }, { status: 400 });
  }

  const logDate = normalizeDateJst(date ? new Date(date) : new Date());

  const existingAnswers = await prisma.checklistAnswer.findMany({
    where: { itemId: { in: answers.map((a) => a.itemId) }, logDate },
  });

  for (const a of answers) {
    if (a.passed === false) {
      const file = form.get(`photo_${a.itemId}`) as File | null;
      const hasNewPhoto = !!file && file.size > 0;
      const hasExistingPhoto = existingAnswers.some(
        (e) => e.itemId === a.itemId && !!e.photoUrl
      );
      if (submit && !hasNewPhoto && !hasExistingPhoto) {
        return NextResponse.json(
          { error: "「否」の項目には写真の添付が必須です。" },
          { status: 400 }
        );
      }
    }
  }

  const { put } = await import("@vercel/blob");

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });

  for (const a of answers) {
    if (a.passed === null || a.passed === undefined) continue;

    let photoUrl: string | undefined;
    const file = form.get(`photo_${a.itemId}`) as File | null;
    if (file && file.size > 0) {
      const blob = await put(
        `checklist/${store?.storeCode ?? "admin"}-${Date.now()}-${a.itemId}-${file.name}`,
        file,
        { access: "public" }
      );
      photoUrl = blob.url;
    }

    await prisma.checklistAnswer.upsert({
      where: { itemId_logDate: { itemId: a.itemId, logDate } },
      update: {
        passed: a.passed,
        note: a.note ?? "",
        ...(photoUrl ? { photoUrl } : {}),
        staffName: `${session.name}（事務所代筆）`,
        editedByAdmin: true,
      },
      create: {
        storeId: params.storeId,
        itemId: a.itemId,
        logDate,
        passed: a.passed,
        note: a.note ?? "",
        photoUrl,
        staffName: `${session.name}（事務所代筆）`,
        editedByAdmin: true,
      },
    });
  }

  if (submit) {
    await prisma.checklistSubmission.upsert({
      where: { storeId_logDate: { storeId: params.storeId, logDate } },
      update: {
        staffCondition,
        absenceNote,
        confirmedBy,
        submittedBy: `${session.name}（事務所代筆）`,
        submittedByAdmin: true,
        submittedAt: new Date(),
      },
      create: {
        storeId: params.storeId,
        logDate,
        staffCondition,
        absenceNote,
        confirmedBy,
        submittedBy: `${session.name}（事務所代筆）`,
        submittedByAdmin: true,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
