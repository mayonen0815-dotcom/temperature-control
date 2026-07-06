import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-ink mb-1">現場管理</h1>
        <p className="text-sm text-ink/60 mb-8">温度記録・クレーム・書類提出</p>

        <div className="space-y-4">
          <Link
            href="/store/login"
            className="tap-target flex items-center justify-center gap-3 rounded-card bg-moss text-white font-semibold text-lg py-4 shadow-sm active:scale-[0.98] transition"
          >
            <span className="text-2xl">🏬</span>
            店舗用ログイン
          </Link>
          <Link
            href="/admin/login"
            className="tap-target flex items-center justify-center gap-3 rounded-card border border-ink/15 bg-white text-ink font-semibold text-lg py-4 shadow-sm active:scale-[0.98] transition"
          >
            <span className="text-2xl">🏢</span>
            事務所用ログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
