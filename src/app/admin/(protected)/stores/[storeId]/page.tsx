"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Equipment = {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  active: boolean;
};

export default function StoreEquipmentPage() {
  const params = useParams<{ storeId: string }>();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${params.storeId}/equipment`);
    const data = await res.json();
    setEquipments((data.equipments ?? []).filter((e: Equipment) => e.active));
    setLoading(false);
  }, [params.storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/stores/${params.storeId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, minTemp, maxTemp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      setName("");
      setMinTemp("");
      setMaxTemp("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この設備を削除しますか？（過去の記録は残ります）")) return;
    await fetch(`/api/admin/equipment/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <Link href="/admin/stores" className="text-sm text-ink/50 mb-3 inline-block">
        ← 店舗一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-ink mb-6">設備管理</h1>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">設備名</label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-48"
            placeholder="例：冷蔵庫①"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            基準温度 最小(℃)
          </label>
          <input
            type="number"
            step="0.1"
            className="rounded-card border border-ink/15 px-3 py-2 w-24"
            value={minTemp}
            onChange={(e) => setMinTemp(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            基準温度 最大(℃)
          </label>
          <input
            type="number"
            step="0.1"
            className="rounded-card border border-ink/15 px-3 py-2 w-24"
            value={maxTemp}
            onChange={(e) => setMaxTemp(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          設備を追加
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : equipments.length === 0 ? (
        <p className="text-ink/50 text-sm">まだ設備が登録されていません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">設備名</th>
                <th className="px-4 py-3">基準温度</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {equipments.map((eq) => (
                <tr key={eq.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{eq.name}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {eq.minTemp}℃ 〜 {eq.maxTemp}℃
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-warn text-sm hover:underline"
                    >
                      削除
                    </button>
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
