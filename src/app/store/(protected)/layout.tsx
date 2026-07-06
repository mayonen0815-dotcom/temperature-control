import { redirect } from "next/navigation";
import { getStoreSession } from "@/lib/session";
import StoreNav from "../_components/StoreNav";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStoreSession();
  if (!session) {
    redirect("/store/login");
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-ink/10 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink/50">{session.storeCode}</p>
          <p className="font-bold text-ink">{session.storeName}</p>
        </div>
        <p className="text-sm text-ink/60">{session.staffName} さん</p>
      </header>
      <div className="px-4 py-5 max-w-lg mx-auto">{children}</div>
      <StoreNav />
    </div>
  );
}
