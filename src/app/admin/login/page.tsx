"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }
      router.push("/admin");
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
        <h1 className="text-xl font-bold text-ink mb-6">事務所用ログイン</h1>

        <label className="block text-sm font-medium text-ink/70 mb-1">名前</label>
        <input
          className="w-full rounded-card border border-ink/15 px-4 py-3 mb-4 text-lg tap-target"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="block text-sm font-medium text-ink/70 mb-1">パスワード</label>
        <input
          type="password"
          className="w-full rounded-card border border-ink/15 px-4 py-3 mb-6 text-lg tap-target"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-warn text-sm mb-4 bg-warn/10 rounded-card px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="tap-target w-full rounded-card bg-ink text-white font-semibold text-lg py-4 shadow-sm active:scale-[0.98] transition disabled:opacity-50"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
