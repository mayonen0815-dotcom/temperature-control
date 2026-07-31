"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/employees", label: "従業員管理", icon: "🧑‍🤝‍🧑" },
  { href: "/admin/managers", label: "店舗マネージャー", icon: "⭐" },
  { href: "/admin/retirees", label: "退職者", icon: "📦" },
  { href: "/admin/admins", label: "アカウント管理", icon: "👤" },
];

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-ink/10 min-h-screen py-6 px-3 hidden md:flex flex-col print:hidden">
      <div className="px-3 mb-6">
        <p className="font-bold text-ink">UMAMI 従業員データ管理</p>
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
    </aside>
  );
}
