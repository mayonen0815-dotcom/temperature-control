import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const staffName = String(form.get("staffName") || "").trim();
  const docType = String(form.get("docType") || "").trim();
  const file = form.get("file") as File | null;

  if (!staffName || !docType || !file || file.size === 0) {
    return NextResponse.json(
      { error: "対象者名・書類種別・ファイルを指定してください" },
      { status: 400 }
    );
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(
    `documents/${session.storeCode}-${Date.now()}-${file.name}`,
    file,
    { access: "public" }
  );

  await prisma.document.create({
    data: {
      storeId: session.storeId,
      staffName,
      docType,
      fileUrl: blob.url,
      fileName: file.name,
    },
  });

  return NextResponse.json({ ok: true });
}
