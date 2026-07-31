import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: params.employeeId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const note = String(form.get("note") || "");

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "ファイルを選択してください" }, { status: 400 });
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(
    `employees/${params.employeeId}-${Date.now()}-${file.name}`,
    file,
    { access: "public" }
  );

  const document = await prisma.employeeDocument.create({
    data: {
      employeeId: params.employeeId,
      fileUrl: blob.url,
      fileName: file.name,
      note: note || null,
    },
  });

  return NextResponse.json({ ok: true, document });
}
