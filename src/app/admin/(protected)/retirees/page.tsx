"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Store = { id: string; storeCode: string; name: string; employeeCount: number };

export default function AdminRetireesStoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-2">退職者</h1>
      <p className="text-sm text-ink/50 mb-6">
        店舗を選ぶと、その店舗で退社日が入力されている従業員（退職者）だけが表示されます。
      </p>

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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/retirees/${s.id}`}
                      className="text-moss font-semibold hover:underline"
                    >
                      📦 退職者を見る →
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
