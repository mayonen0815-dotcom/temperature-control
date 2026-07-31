"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type EmployeeDoc = {
  id: string;
  fileUrl: string;
  fileName: string;
  note: string | null;
  createdAt: string;
};

export default function EmployeeFolderPage() {
  const params = useParams<{ storeId: string; employeeId: string }>();
  const [documents, setDocuments] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/employees/${params.employeeId}/documents`);
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }, [params.employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("note", note);
      const res = await fetch(`/api/admin/employees/${params.employeeId}/documents`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "アップロードに失敗しました");
        return;
      }
      setFile(null);
      setNote("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("このファイルを削除しますか？（元に戻せません）")) return;
    await fetch(`/api/admin/employee-documents/${docId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <Link
        href={`/admin/employees/${params.storeId}`}
        className="text-sm text-ink/50 mb-3 inline-block"
      >
        ← 従業員一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-ink mb-6">📁 書類フォルダ</h1>

      <form
        onSubmit={handleUpload}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">ファイル</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-ink/60 mb-1">メモ（任意）</label>
          <input
            className="w-full rounded-card border border-ink/15 px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：入社誓約書、履歴書、健康診断書など"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          {submitting ? "アップロード中..." : "追加する"}
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : documents.length === 0 ? (
        <p className="text-ink/50 text-sm">まだファイルがありません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">ファイル</th>
                <th className="px-4 py-3">メモ</th>
                <th className="px-4 py-3">追加日時</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <a href={d.fileUrl} target="_blank" className="text-moss underline">
                      {d.fileName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{d.note || "-"}</td>
                  <td className="px-4 py-3 text-ink/50">
                    {new Date(d.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
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
