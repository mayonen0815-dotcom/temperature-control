"use client";

import { useCallback, useEffect, useState } from "react";

type Admin = { id: string; name: string };

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    setAdmins(data.admins ?? []);
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
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      setName("");
      setPassword("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」のアカウントを削除しますか？（元に戻せません）`)) return;
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "削除に失敗しました");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">事務所アカウント管理</h1>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">名前</label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-48"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">パスワード</label>
          <input
            type="password"
            className="rounded-card border border-ink/15 px-3 py-2 w-48"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          アカウントを追加
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
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{a.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(a.id, a.name)}
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
      <p className="text-xs text-ink/40 mt-3">
        ログイン中の自分のアカウントと、最後の1つのアカウントは削除できません。
      </p>
    </div>
  );
}
