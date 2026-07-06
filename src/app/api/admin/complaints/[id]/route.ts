import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { status, title, detail } = await req.json();
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (title !== undefined) data.title = title;
  if (detail !== undefined) data.detail = detail;

  const complaint = await prisma.complaint.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, complaint });
}
