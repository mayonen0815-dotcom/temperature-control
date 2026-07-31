"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Store = {
  id: string;
  storeCode: string;
  name: string;
  active: boolean;
  employeeCount: number;
};

export default function AdminDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalEmployees = stores.reduce((sum, s) => sum + s.employeeCount, 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">ダッシュボード</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-card border border-ink/10 p-5">
          <p className="text-xs text-ink/50 mb-1">登録店舗数</p>
          <p className="text-3xl font-bold text-ink">{stores.length}店舗</p>
        </div>
        <div className="bg-white rounded-card border border-ink/10 p-5">
          <p className="text-xs text-ink/50 mb-1">登録従業員数（全店舗合計）</p>
          <p className="text-3xl font-bold text-ink">{totalEmployees}名</p>
        </div>
      </div>

      <h2 className="font-bold text-ink mb-3">店舗一覧</h2>
      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗ID</th>
                <th className="px-4 py-3">店舗名</th>
                <th className="px-4 py-3">従業員数</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-mono text-ink/70">{s.storeCode}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3">{s.employeeCount}名</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${s.id}`}
                      className="text-moss font-semibold hover:underline"
                    >
                      従業員情報を開く →
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
