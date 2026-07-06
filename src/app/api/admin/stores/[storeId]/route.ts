import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { hashSecret } from "@/lib/password";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, pin, active } = await req.json();
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (active !== undefined) data.active = active;
  if (pin) data.pinHash = hashSecret(String(pin));

  const store = await prisma.store.update({ where: { id: params.storeId }, data });
  return NextResponse.json({ ok: true, store });
}
