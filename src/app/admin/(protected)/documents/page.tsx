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

type StoreOption = { id: string; name: string; storeCode: string };

const DOC_TYPES = ["健康診断書", "誓約書", "履歴書", "資格証", "その他"];

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
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetch("/api/admin/stores")
      .then((r) => r.json())
      .then((d) =>
        setStores(
          (d.stores ?? []).map((s: any) => ({ id: s.id, name: s.name, storeCode: s.storeCode }))
        )
      );
  }, []);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">書類確認</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-card bg-moss text-white font-semibold px-4 py-1.5 text-sm"
          >
            {showForm ? "閉じる" : "＋ 書類を追加"}
          </button>
          <button
            onClick={load}
            className="rounded-card border border-ink/15 px-4 py-1.5 text-sm text-ink/70 hover:bg-ink/5"
          >
            🔄 更新
          </button>
        </div>
      </div>

      {showForm && (
        <NewDocumentForm
          stores={stores}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

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

function NewDocumentForm({
  stores,
  onCreated,
}: {
  stores: StoreOption[];
  onCreated: () => void;
}) {
  const [storeId, setStoreId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("storeId", storeId);
      fd.append("staffName", staffName);
      fd.append("docType", docType);
      fd.append("file", file);

      const res = await fetch("/api/admin/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-card border border-ink/10 p-4 mb-6 space-y-3"
    >
      <div className="grid md:grid-cols-3 gap-3">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="rounded-card border border-ink/15 px-3 py-2"
          required
        >
          <option value="">店舗を選択</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（{s.storeCode}）
            </option>
          ))}
        </select>
        <input
          className="rounded-card border border-ink/15 px-3 py-2"
          placeholder="対象者名　例：田中太郎"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          required
        />
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-card border border-ink/15 px-3 py-2"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {error && <p className="text-warn text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-card bg-clay text-white font-semibold px-5 py-2 disabled:opacity-50"
      >
        {submitting ? "送信中..." : "追加する"}
      </button>
    </form>
  );
}
