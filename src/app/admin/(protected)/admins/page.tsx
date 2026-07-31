"use client";

import { useCallback, useEffect, useState } from "react";

type Admin = { id: string; name: string };

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");

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
        body: JSON.stringify({ name }),
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

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `「${name}」のアカウントを削除しますか？\n同じ名前の店舗がある場合、その店舗の従業員データ・書類フォルダも一緒に削除されます。（元に戻せません）`
      )
    )
      return;
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "削除に失敗しました");
      return;
    }
    await load();
  }

  function startRename(admin: Admin) {
    setEditingId(admin.id);
    setEditingName(admin.name);
    setRenameError("");
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
    setRenameError("");
  }

  async function saveRename(id: string) {
    setRenameError("");
    setRenaming(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.error || "変更に失敗しました");
        return;
      }
      cancelRename();
      await load();
    } finally {
      setRenaming(false);
    }
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
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          アカウントを追加
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      <p className="text-xs text-ink/40 mb-6">
        追加したアカウントには、共通のログインパスワードが自動で設定されます。
      </p>

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
                  <td className="px-4 py-3 font-semibold text-ink">
                    {editingId === a.id ? (
                      <div>
                        <input
                          className="rounded-card border border-ink/15 px-3 py-1.5 w-48 text-sm"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                        {renameError && (
                          <p className="text-warn text-xs mt-1">{renameError}</p>
                        )}
                      </div>
                    ) : (
                      a.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {editingId === a.id ? (
                      <>
                        <button
                          onClick={() => saveRename(a.id)}
                          disabled={renaming}
                          className="text-moss text-sm hover:underline disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelRename}
                          className="text-ink/40 text-sm hover:underline"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startRename(a)}
                          className="text-moss text-sm hover:underline"
                        >
                          名前変更
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          className="text-warn text-sm hover:underline"
                        >
                          削除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink/40 mt-3">
        ログイン中の自分のアカウントと、最後の1つのアカウントは削除できません。
        アカウント名と同じ店舗が「従業員管理」「退職者」にも自動で反映されます（削除すると、その店舗の従業員データも一緒に削除されます。名前変更すると、店舗名も一緒に変わります）。
      </p>
    </div>
  );
}
