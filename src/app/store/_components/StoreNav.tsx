"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/store", label: "メニュー", icon: "🏠" },
  { href: "/store/temperature", label: "温度記録", icon: "🌡️" },
  { href: "/store/checklist", label: "重点管理", icon: "✅" },
  { href: "/store/documents", label: "書類提出", icon: "📄" },
];

export default function StoreNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/store/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink/10 flex">
      {items.map((item) => {
        const active = item.href === "/store" ? pathname === "/store" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 tap-target flex flex-col items-center justify-center py-2 text-xs ${
              active ? "text-moss font-semibold" : "text-ink/50"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="flex-1 tap-target flex flex-col items-center justify-center py-2 text-xs text-ink/40"
      >
        <span className="text-lg">🚪</span>
        ログアウト
      </button>
    </nav>
  );
}
