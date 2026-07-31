import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.employeeDocument.delete({ where: { id: params.docId } });
  return NextResponse.json({ ok: true });
}
