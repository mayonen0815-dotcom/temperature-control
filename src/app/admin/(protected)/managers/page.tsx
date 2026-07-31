"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Manager = {
  id: string;
  name: string;
  address: string | null;
  hireDate: string | null;
  storeId: string;
  storeName: string;
};

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export default function StoreManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/managers");
    const data = await res.json();
    setManagers(data.managers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-2">店舗マネージャー</h1>
      <p className="text-sm text-ink/50 mb-6">
        雇用形態が「正社員（マネージャー等）」の在籍者を、全店舗まとめて表示しています。
      </p>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : managers.length === 0 ? (
        <p className="text-ink/50 text-sm">該当するマネージャーはいません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗名</th>
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">入社日</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{m.storeName}</td>
                  <td className="px-4 py-3 text-ink">{m.name}</td>
                  <td className="px-4 py-3 text-ink/70">{m.address || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{toDateInput(m.hireDate) || "-"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      href={`/admin/employees/${m.storeId}/${m.id}`}
                      className="text-moss text-sm hover:underline"
                    >
                      📁 フォルダ
                    </Link>
                    <Link
                      href={`/admin/employees/${m.storeId}`}
                      className="text-moss text-sm hover:underline"
                    >
                      編集はこちら →
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
