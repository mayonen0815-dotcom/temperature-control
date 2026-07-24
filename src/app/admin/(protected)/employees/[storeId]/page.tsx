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

export default function StoreEmployeesPage() {
  const params = useParams<{ storeId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [resignDate, setResignDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${params.storeId}/employees`);
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  }, [params.storeId]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setAddress("");
    setHireDate("");
    setResignDate("");
    setNote("");
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setName(emp.name);
    setAddress(emp.address ?? "");
    setHireDate(toDateInput(emp.hireDate));
    setResignDate(toDateInput(emp.resignDate));
    setNote(emp.note ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body = { name, address, hireDate: hireDate || null, resignDate: resignDate || null, note };
      const res = editingId
        ? await fetch(`/api/admin/employees/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/stores/${params.storeId}/employees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      resetForm();
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この従業員情報を削除しますか？")) return;
    await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div>
      <Link href="/admin/employees" className="text-sm text-ink/50 mb-3 inline-block">
        ← 店舗一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-ink mb-6">従業員情報</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6"
      >
        <p className="text-sm font-semibold text-ink/70 mb-3">
          {editingId ? "従業員情報を編集" : "従業員を追加"}
        </p>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">氏名</label>
            <input
              className="w-full rounded-card border border-ink/15 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">住所</label>
            <input
              className="w-full rounded-card border border-ink/15 px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例：大阪府大阪市〇〇1-2-3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">入社日</label>
            <input
              type="date"
              className="w-full rounded-card border border-ink/15 px-3 py-2"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">
              退社日（在籍中は空欄）
            </label>
            <input
              type="date"
              className="w-full rounded-card border border-ink/15 px-3 py-2"
              value={resignDate}
              onChange={(e) => setResignDate(e.target.value)}
            />
          </div>
        </div>
        <label className="block text-xs font-medium text-ink/60 mb-1">備考（任意）</label>
        <textarea
          className="w-full rounded-card border border-ink/15 px-3 py-2 mb-3 min-h-[60px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-warn text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
          >
            {editingId ? "更新する" : "追加する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-card border border-ink/20 text-ink px-5 py-2"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : employees.length === 0 ? (
        <p className="text-ink/50 text-sm">まだ従業員が登録されていません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">入社日</th>
                <th className="px-4 py-3">退社日</th>
                <th className="px-4 py-3">状態</th>
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
                  <td className="px-4 py-3">
                    {emp.resignDate ? (
                      <span className="text-ink/40">退職済</span>
                    ) : (
                      <span className="text-ok">在籍中</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(emp)}
                      className="text-moss text-sm hover:underline"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
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
