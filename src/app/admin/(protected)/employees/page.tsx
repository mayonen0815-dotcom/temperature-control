"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Store = { id: string; storeCode: string; name: string; employeeCount: number };

export default function AdminEmployeesStoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stores");
    const data = await res.json();
    setStores(
      (data.stores ?? []).map((s: any) => ({
        id: s.id,
        storeCode: s.storeCode,
        name: s.name,
        employeeCount: s.employeeCount,
      }))
    );
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
      const storeCode = `STORE-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      setName("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-2">従業員管理</h1>
      <p className="text-sm text-ink/50 mb-6">
        店舗を選ぶと、その店舗の従業員（氏名・住所・入退社日・備考）を管理できます。
      </p>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-ink/60 mb-1">新しい店舗名</label>
          <input
            className="w-full rounded-card border border-ink/15 px-3 py-2"
            placeholder="例：BUTAKIN六本木"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
      ) : stores.length === 0 ? (
        <p className="text-ink/50 text-sm">まだ店舗がありません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗名</th>
                <th className="px-4 py-3">従業員数</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3 text-ink/70">{s.employeeCount}名</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${s.id}`}
                      className="text-moss font-semibold hover:underline"
                    >
                      📁 従業員一覧を開く →
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
