"use client";

import { useCallback, useEffect, useState } from "react";

type Complaint = {
  id: string;
  title: string;
  detail: string;
  photoUrl: string | null;
  status: "NEW" | "IN_PROGRESS" | "DONE";
  staffName: string;
  createdByAdmin: boolean;
  createdAt: string;
  store: { name: string; storeCode: string };
};

type StoreOption = { id: string; name: string; storeCode: string };

const STATUS_LABEL: Record<Complaint["status"], string> = {
  NEW: "未対応",
  IN_PROGRESS: "対応中",
  DONE: "完了",
};

const STATUS_COLOR: Record<Complaint["status"], string> = {
  NEW: "bg-warn/15 text-warn",
  IN_PROGRESS: "bg-clay/15 text-clay",
  DONE: "bg-ok/15 text-ok",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [filter, setFilter] = useState<"ALL" | Complaint["status"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url =
      filter === "ALL" ? "/api/admin/complaints" : `/api/admin/complaints?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setComplaints(data.complaints ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/stores")
      .then((r) => r.json())
      .then((d) => setStores((d.stores ?? []).map((s: any) => ({ id: s.id, name: s.name, storeCode: s.storeCode }))));
  }, []);

  async function updateStatus(id: string, status: Complaint["status"]) {
    await fetch(`/api/admin/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">クレーム管理</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-card bg-moss text-white font-semibold px-4 py-2 text-sm"
        >
          {showForm ? "閉じる" : "＋ 代筆で新規作成"}
        </button>
      </div>

      {showForm && (
        <NewComplaintForm
          stores={stores}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="flex gap-2 mb-4">
        {(["ALL", "NEW", "IN_PROGRESS", "DONE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f ? "bg-ink text-white" : "bg-white text-ink/60 border border-ink/10"
            }`}
          >
            {f === "ALL" ? "すべて" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : complaints.length === 0 ? (
        <p className="text-ink/50 text-sm">該当するクレームはありません。</p>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="bg-white rounded-card border border-ink/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-ink/40">{c.store.storeCode}</span>
                    <span className="text-sm font-semibold text-ink">{c.store.name}</span>
                  </div>
                  <p className="font-bold text-ink">{c.title}</p>
                  <p className="text-sm text-ink/70 mt-1 whitespace-pre-wrap">{c.detail}</p>
                  <p className="text-xs text-ink/40 mt-2">
                    報告者：{c.staffName}　{new Date(c.createdAt).toLocaleString("ja-JP")}
                  </p>
                  {c.photoUrl && (
                    <a
                      href={c.photoUrl}
                      target="_blank"
                      className="text-xs text-moss underline mt-1 inline-block"
                    >
                      添付写真を見る
                    </a>
                  )}
                </div>
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value as Complaint["status"])}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold border-none ${STATUS_COLOR[c.status]}`}
                >
                  {(["NEW", "IN_PROGRESS", "DONE"] as const).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewComplaintForm({
  stores,
  onCreated,
}: {
  stores: StoreOption[];
  onCreated: () => void;
}) {
  const [storeId, setStoreId] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("storeId", storeId);
      fd.append("title", title);
      fd.append("detail", detail);
      fd.append("staffName", staffName);
      if (photo) fd.append("photo", photo);

      const res = await fetch("/api/admin/complaints", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "作成に失敗しました");
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
      <p className="text-sm font-semibold text-ink/70">代筆でクレームを登録</p>
      <div className="grid md:grid-cols-2 gap-3">
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
          placeholder="報告者名（電話で聞いた担当者名など）"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
        />
      </div>
      <input
        className="w-full rounded-card border border-ink/15 px-3 py-2"
        placeholder="件名"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-card border border-ink/15 px-3 py-2 min-h-[100px]"
        placeholder="内容"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {error && <p className="text-warn text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-card bg-clay text-white font-semibold px-5 py-2 disabled:opacity-50"
      >
        {submitting ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
