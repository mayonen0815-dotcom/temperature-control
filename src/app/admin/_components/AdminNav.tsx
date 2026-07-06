"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/admin", label: "提出状況", icon: "📊" },
  { href: "/admin/complaints", label: "クレーム管理", icon: "📝" },
  { href: "/admin/documents", label: "書類確認", icon: "📄" },
  { href: "/admin/stores", label: "店舗・設備管理", icon: "🏬" },
];

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-ink/10 min-h-screen py-6 px-3 hidden md:flex flex-col">
      <div className="px-3 mb-6">
        <p className="font-bold text-ink">現場管理（事務所）</p>
        <p className="text-xs text-ink/50">{adminName} さん</p>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-card px-3 py-2 text-sm font-medium ${
                active ? "bg-moss/10 text-moss" : "text-ink/60 hover:bg-ink/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 text-left rounded-card px-3 py-2 text-sm text-ink/40 hover:bg-ink/5"
      >
        🚪 ログアウト
      </button>
    </aside>
  );
}
