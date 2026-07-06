import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const detail = String(form.get("detail") || "").trim();
  const photo = form.get("photo") as File | null;

  if (!title || !detail) {
    return NextResponse.json({ error: "件名と内容を入力してください" }, { status: 400 });
  }

  let photoUrl: string | undefined;
  if (photo && photo.size > 0) {
    // Vercel Blob へのアップロード（BLOB_READ_WRITE_TOKEN が必要）
    const { put } = await import("@vercel/blob");
    const blob = await put(
      `complaints/${session.storeCode}-${Date.now()}-${photo.name}`,
      photo,
      { access: "public" }
    );
    photoUrl = blob.url;
  }

  await prisma.complaint.create({
    data: {
      storeId: session.storeId,
      title,
      detail,
      photoUrl,
      staffName: session.staffName,
    },
  });

  return NextResponse.json({ ok: true });
}
