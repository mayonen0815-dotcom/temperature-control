import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
  }
  const newName = String(name).trim();

  const admin = await prisma.adminUser.findUnique({ where: { id: params.id } });
  if (!admin) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  if (newName !== admin.name) {
    const existing = await prisma.adminUser.findFirst({ where: { name: newName } });
    if (existing) {
      return NextResponse.json({ error: "その名前は既に使われています" }, { status: 409 });
    }
  }

  const oldName = admin.name;
  const updated = await prisma.adminUser.update({
    where: { id: params.id },
    data: { name: newName },
  });

  // 同じ名前の店舗があれば、店舗名も一緒に変更する
  const store = await prisma.store.findFirst({ where: { name: oldName } });
  if (store) {
    await prisma.store.update({ where: { id: store.id }, data: { name: newName } });
  }

  return NextResponse.json({ ok: true, admin: { id: updated.id, name: updated.name } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (session.adminId === params.id) {
    return NextResponse.json(
      { error: "ログイン中の自分のアカウントは削除できません" },
      { status: 400 }
    );
  }

  const count = await prisma.adminUser.count();
  if (count <= 1) {
    return NextResponse.json(
      { error: "最後の1つのアカウントは削除できません" },
      { status: 400 }
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: params.id } });

  await prisma.adminUser.delete({ where: { id: params.id } });

  // アカウント名と同じ店舗があれば、従業員・書類フォルダごと削除する
  if (admin) {
    const store = await prisma.store.findFirst({ where: { name: admin.name } });
    if (store) {
      const employees = await prisma.employee.findMany({ where: { storeId: store.id } });
      const employeeIds = employees.map((e) => e.id);
      await prisma.employeeDocument.deleteMany({ where: { employeeId: { in: employeeIds } } });
      await prisma.employee.deleteMany({ where: { storeId: store.id } });
      await prisma.store.delete({ where: { id: store.id } });
    }
  }

  return NextResponse.json({ ok: true });
}
