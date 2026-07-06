import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import AdminNav from "../_components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <AdminNav adminName={session.name} />
      <main className="flex-1 px-6 py-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
