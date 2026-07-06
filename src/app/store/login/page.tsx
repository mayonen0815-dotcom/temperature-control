"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StoreLoginPage() {
  const router = useRouter();
  const [storeCode, setStoreCode] = useState("");
  const [pin, setPin] = useState("");
  const [staffName, setStaffName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/store/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode, pin, staffName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }
      router.push("/store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink/50 mb-4 inline-block">
          ← トップに戻る
        </Link>
        <h1 className="text-xl font-bold text-ink mb-6">店舗用ログイン</h1>

        <label className="block text-sm font-medium text-ink/70 mb-1">
          店舗ID
        </label>
        <input
          className="w-full rounded-card border border-ink/15 px-4 py-3 mb-4 text-lg tap-target"
          placeholder="例：BTK-001"
          value={storeCode}
          onChange={(e) => setStoreCode(e.target.value)}
          autoCapitalize="characters"
          required
        />

        <label className="block text-sm font-medium text-ink/70 mb-1">
          店舗PIN（設定されている場合）
        </label>
        <input
          className="w-full rounded-card border border-ink/15 px-4 py-3 mb-4 text-lg tap-target"
          type="password"
          inputMode="numeric"
          placeholder="4桁PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <label className="block text-sm font-medium text-ink/70 mb-1">
          あなたのお名前
        </label>
        <input
          className="w-full rounded-card border border-ink/15 px-4 py-3 mb-6 text-lg tap-target"
          placeholder="例：山田"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          required
        />

        {error && (
          <p className="text-warn text-sm mb-4 bg-warn/10 rounded-card px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="tap-target w-full rounded-card bg-moss text-white font-semibold text-lg py-4 shadow-sm active:scale-[0.98] transition disabled:opacity-50"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
