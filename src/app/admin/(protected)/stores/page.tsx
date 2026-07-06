"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Store = {
  id: string;
  storeCode: string;
  name: string;
  active: boolean;
  hasPin: boolean;
  equipmentCount: number;
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stores");
    const data = await res.json();
    setStores(data.stores ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode, name, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      setStoreCode("");
      setName("");
      setPin("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">店舗・設備管理</h1>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            店舗ID
          </label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-40"
            placeholder="例：BTK-001"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            店舗名
          </label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-56"
            placeholder="例：BUTAKIN六本木"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            PIN（任意）
          </label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-28"
            placeholder="4桁"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          店舗を追加
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗ID</th>
                <th className="px-4 py-3">店舗名</th>
                <th className="px-4 py-3">設備数</th>
                <th className="px-4 py-3">PIN</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-mono text-ink/70">{s.storeCode}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3">{s.equipmentCount}台</td>
                  <td className="px-4 py-3">{s.hasPin ? "設定済み" : "未設定"}</td>
                  <td className="px-4 py-3">
                    {s.active ? (
                      <span className="text-ok">稼働中</span>
                    ) : (
                      <span className="text-ink/40">停止中</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/stores/${s.id}`}
                      className="text-moss font-semibold hover:underline"
                    >
                      設備を管理 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
