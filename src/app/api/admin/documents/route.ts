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
