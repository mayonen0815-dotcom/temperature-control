import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    include: { store: { select: { name: true, storeCode: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const storeId = String(form.get("storeId") || "");
  const staffName = String(form.get("staffName") || "").trim();
  const docType = String(form.get("docType") || "").trim();
  const file = form.get("file") as File | null;

  if (!storeId || !staffName || !docType || !file || file.size === 0) {
    return NextResponse.json(
      { error: "店舗・対象者名・書類種別・ファイルを指定してください" },
      { status: 400 }
    );
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });

  const { put } = await import("@vercel/blob");
  const blob = await put(
    `documents/${store.storeCode}-${Date.now()}-${file.name}`,
    file,
    { access: "public" }
  );

  const document = await prisma.document.create({
    data: {
      storeId,
      staffName,
      docType,
      fileUrl: blob.url,
      fileName: file.name,
    },
  });

  return NextResponse.json({ ok: true, document });
}
