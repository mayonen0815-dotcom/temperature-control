import Link from "next/link";

const menu = [
  {
    href: "/store/temperature",
    label: "温度記録",
    desc: "朝・夜の温度を入力して提出",
    icon: "🌡️",
  },
  {
    href: "/store/complaints",
    label: "クレーム報告",
    desc: "お客様対応の内容を報告",
    icon: "📝",
  },
  {
    href: "/store/documents",
    label: "書類提出",
    desc: "健康診断書・誓約書などを提出",
    icon: "📄",
  },
];

export default function StoreHomePage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-ink mb-4">メニュー</h1>
      <div className="space-y-4">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-card bg-white border border-ink/10 shadow-sm px-5 py-5 active:scale-[0.98] transition"
          >
            <span className="text-4xl">{item.icon}</span>
            <div>
              <p className="font-bold text-ink text-lg">{item.label}</p>
              <p className="text-sm text-ink/50">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
