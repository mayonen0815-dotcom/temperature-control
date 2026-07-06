"use client";

import { useCallback, useEffect, useState } from "react";

type Document = {
  id: string;
  staffName: string;
  docType: string;
  fileUrl: string;
  fileName: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  store: { name: string; storeCode: string };
};

const STATUS_LABEL: Record<Document["status"], string> = {
  SUBMITTED: "確認待ち",
  APPROVED: "承認済み",
  REJECTED: "要再提出",
};

const STATUS_COLOR: Record<Document["status"], string> = {
  SUBMITTED: "bg-warn/15 text-warn",
  APPROVED: "bg-ok/15 text-ok",
  REJECTED: "bg-ink/10 text-ink/60",
};

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/documents");
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: Document["status"]) {
    await fetch(`/api/admin/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">書類確認</h1>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : documents.length === 0 ? (
        <p className="text-ink/50 text-sm">提出された書類はありません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">店舗</th>
                <th className="px-4 py-3">対象者</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">ファイル</th>
                <th className="px-4 py-3">提出日時</th>
                <th className="px-4 py-3">状態</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{d.store.name}</p>
                    <p className="text-xs text-ink/40">{d.store.storeCode}</p>
                  </td>
                  <td className="px-4 py-3">{d.staffName}</td>
                  <td className="px-4 py-3">{d.docType}</td>
                  <td className="px-4 py-3">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      className="text-moss underline"
                    >
                      {d.fileName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink/50">
                    {new Date(d.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={(e) => updateStatus(d.id, e.target.value as Document["status"])}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold border-none ${STATUS_COLOR[d.status]}`}
                    >
                      {(["SUBMITTED", "APPROVED", "REJECTED"] as const).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
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
