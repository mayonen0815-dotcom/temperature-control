import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const photo = form.get("photo") as File | null;
  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: "写真を選択してください" }, { status: 400 });
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(`checklist-groups/${params.groupId}-${Date.now()}-${photo.name}`, photo, {
    access: "public",
  });

  const group = await prisma.checklistGroup.update({
    where: { id: params.groupId },
    data: { referencePhotoUrl: blob.url },
  });

  return NextResponse.json({ ok: true, group });
}
