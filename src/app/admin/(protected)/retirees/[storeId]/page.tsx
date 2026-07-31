"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Employee = {
  id: string;
  name: string;
  address: string | null;
  hireDate: string | null;
  resignDate: string | null;
  note: string | null;
};

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export default function StoreRetireesPage() {
  const params = useParams<{ storeId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${params.storeId}/employees`);
    const data = await res.json();
    setEmployees((data.employees ?? []).filter((e: Employee) => !!e.resignDate));
    setLoading(false);
  }, [params.storeId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Link href="/admin/retirees" className="text-sm text-ink/50 mb-3 inline-block">
        ← 店舗一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-ink mb-6">📦 退職者</h1>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : employees.length === 0 ? (
        <p className="text-ink/50 text-sm">この店舗に退職者はいません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">入社日</th>
                <th className="px-4 py-3">退社日</th>
                <th className="px-4 py-3">備考</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{emp.name}</td>
                  <td className="px-4 py-3 text-ink/70">{emp.address || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{toDateInput(emp.hireDate) || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{toDateInput(emp.resignDate) || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{emp.note || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/employees/${params.storeId}/${emp.id}`}
                      className="text-moss text-sm hover:underline"
                    >
                      📁 フォルダ
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
