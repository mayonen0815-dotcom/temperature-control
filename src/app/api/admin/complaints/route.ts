import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const complaints = await prisma.complaint.findMany({
    where: status ? { status: status as any } : undefined,
    include: { store: { select: { name: true, storeCode: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const storeId = String(form.get("storeId") || "");
  const title = String(form.get("title") || "").trim();
  const detail = String(form.get("detail") || "").trim();
  const staffName = String(form.get("staffName") || "").trim();
  const photo = form.get("photo") as File | null;

  if (!storeId || !title || !detail) {
    return NextResponse.json({ error: "店舗・件名・内容を入力してください" }, { status: 400 });
  }

  let photoUrl: string | undefined;
  if (photo && photo.size > 0) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`complaints/admin-${Date.now()}-${photo.name}`, photo, {
      access: "public",
    });
    photoUrl = blob.url;
  }

  const complaint = await prisma.complaint.create({
    data: {
      storeId,
      title,
      detail,
      photoUrl,
      staffName: staffName ? `${staffName}（事務所代筆）` : `${session.name}（事務所代筆）`,
      createdByAdmin: true,
    },
  });

  return NextResponse.json({ ok: true, complaint });
}
