"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const MAIN_EMPLOYMENT_TYPES = ["正社員", "正社員（マネージャー等）", "アルバイト", "異動", "その他"];
const SUB_EMPLOYMENT_TYPES = ["契約社員", "業務委託", "不明"];

// 保存されている雇用形態の値から、上段（メイン）・下段（その他選択時のサブ）の選択状態を組み立てる
function splitEmploymentType(value: string | null) {
  if (!value) return { main: MAIN_EMPLOYMENT_TYPES[0], sub: SUB_EMPLOYMENT_TYPES[0] };
  if (MAIN_EMPLOYMENT_TYPES.includes(value) && value !== "その他") {
    return { main: value, sub: SUB_EMPLOYMENT_TYPES[0] };
  }
  if (SUB_EMPLOYMENT_TYPES.includes(value)) {
    return { main: "その他", sub: value };
  }
  // パートなど、過去に使われていたが今の選択肢に無い値は「その他」扱いにしつつ元の値を保持する
  return { main: "その他", sub: value };
}

type Employee = {
  id: string;
  name: string;
  address: string | null;
  employmentType: string | null;
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
  const [mainType, setMainType] = useState(MAIN_EMPLOYMENT_TYPES[0]);
  const [subType, setSubType] = useState(SUB_EMPLOYMENT_TYPES[0]);
  const [hireDate, setHireDate] = useState("");
  const [resignDate, setResignDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResigned, setShowResigned] = useState(false);
  const [transferCandidates, setTransferCandidates] = useState<{
    employeeId: string;
    employeeName: string;
    options: { id: string; storeId: string; storeName: string; employmentType: string | null }[];
  } | null>(null);

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
    setMainType(MAIN_EMPLOYMENT_TYPES[0]);
    setSubType(SUB_EMPLOYMENT_TYPES[0]);
    setHireDate("");
    setResignDate("");
    setNote("");
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setName(emp.name);
    setAddress(emp.address ?? "");
    const { main, sub } = splitEmploymentType(emp.employmentType);
    setMainType(main);
    setSubType(sub);
    setHireDate(toDateInput(emp.hireDate));
    setResignDate(toDateInput(emp.resignDate));
    setNote(emp.note ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const employmentType = mainType === "その他" ? subType : mainType;
      const body = {
        name,
        address,
        employmentType,
        hireDate: hireDate || null,
        resignDate: resignDate || null,
        note,
      };
      const wasEditingId = editingId;
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

      if (wasEditingId && employmentType === "異動") {
        await checkTransfer(wasEditingId, name);
      }
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

  // 「異動」で保存した従業員と同姓同名で、他店舗に在籍中の人がいないか自動チェックする
  async function checkTransfer(employeeId: string, employeeName: string) {
    const res = await fetch(`/api/admin/employees/${employeeId}/transfer-candidates`);
    const data = await res.json();
    const candidates = data.candidates ?? [];

    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      // 候補が1件だけなら、同一人物として自動的にこちらの登録を削除する
      await fetch(`/api/admin/employees/${employeeId}`, { method: "DELETE" });
      await load();
      alert(
        `${employeeName} さんは「${candidates[0].storeName}」に在籍が見つかったため、こちらの登録は自動的に削除しました。`
      );
      return;
    }

    // 候補が複数ある場合は、どの店舗の人と同一人物か手動で選んでもらう
    setTransferCandidates({ employeeId, employeeName, options: candidates });
  }

  async function confirmTransfer(storeName: string) {
    if (!transferCandidates) return;
    await fetch(`/api/admin/employees/${transferCandidates.employeeId}`, { method: "DELETE" });
    setTransferCandidates(null);
    await load();
    alert(`「${storeName}」の在籍者と同一人物として、こちらの登録を削除しました。`);
  }

  const visibleEmployees = showResigned
    ? employees
    : employees.filter((emp) => !emp.resignDate);
  const resignedCount = employees.filter((emp) => !!emp.resignDate).length;

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
            <label className="block text-xs font-medium text-ink/60 mb-1">雇用形態</label>
            <select
              className="w-full rounded-card border border-ink/15 px-3 py-2"
              value={mainType}
              onChange={(e) => setMainType(e.target.value)}
            >
              {MAIN_EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {mainType === "その他" && (
              <select
                className="w-full rounded-card border border-ink/15 px-3 py-2 mt-2"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
              >
                {!SUB_EMPLOYMENT_TYPES.includes(subType) && (
                  <option value={subType}>{subType}（従来の値）</option>
                )}
                {SUB_EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
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

      {transferCandidates && (
        <div className="bg-white rounded-card border border-warn/40 p-4 mb-6">
          <p className="text-sm font-semibold text-ink mb-3">
            「{transferCandidates.employeeName}」さんと同姓同名の在籍者が複数の店舗で見つかりました。
            異動先はどちらですか？
          </p>
          <ul className="space-y-2 mb-3">
            {transferCandidates.options.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between bg-ink/5 rounded-card px-3 py-2"
              >
                <span className="text-sm text-ink/70">
                  {opt.storeName}（{opt.employmentType || "-"}）
                </span>
                <button
                  onClick={() => confirmTransfer(opt.storeName)}
                  className="text-warn text-sm font-semibold hover:underline"
                >
                  この人に統合してこちらを削除
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setTransferCandidates(null)}
            className="text-ink/40 text-sm hover:underline"
          >
            何もしない（このまま残す）
          </button>
        </div>
      )}

      {!loading && employees.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-ink/60 mb-3">
          <input
            type="checkbox"
            checked={showResigned}
            onChange={(e) => setShowResigned(e.target.checked)}
          />
          退職済みも表示する（{resignedCount}名）
        </label>
      )}

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : employees.length === 0 ? (
        <p className="text-ink/50 text-sm">まだ従業員が登録されていません。</p>
      ) : visibleEmployees.length === 0 ? (
        <p className="text-ink/50 text-sm">在籍中の従業員はいません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">住所</th>
                <th className="px-4 py-3">雇用形態</th>
                <th className="px-4 py-3">入社日</th>
                <th className="px-4 py-3">退社日</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{emp.name}</td>
                  <td className="px-4 py-3 text-ink/70">{emp.address || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{emp.employmentType || "-"}</td>
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
                    <Link
                      href={`/admin/employees/${params.storeId}/${emp.id}`}
                      className="text-moss text-sm hover:underline"
                    >
                      📁 フォルダ
                    </Link>
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
