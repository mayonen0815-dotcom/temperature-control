"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Store = { id: string; storeCode: string; name: string };

export default function AdminEmployeesStoreListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stores")
      .then((r) => r.json())
      .then((d) => {
        setStores((d.stores ?? []).map((s: any) => ({ id: s.id, storeCode: s.storeCode, name: s.name })));
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">従業員情報</h1>
      <p className="text-sm text-ink/50 mb-4">
        店舗を選ぶと、その店舗の従業員（入退社情報・住所）を管理できます。
      </p>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗ID</th>
                <th className="px-4 py-3">店舗名</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-mono text-ink/70">{s.storeCode}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${s.id}`}
                      className="text-moss font-semibold hover:underline"
                    >
                      従業員一覧を開く →
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
