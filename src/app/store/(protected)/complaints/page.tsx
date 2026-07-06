"use client";

import { useState } from "react";

export default function StoreComplaintsPage() {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("detail", detail);
      if (photo) fd.append("photo", photo);

      const res = await fetch("/api/store/complaints", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました");
        return;
      }
      setTitle("");
      setDetail("");
      setPhoto(null);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-ink mb-1">クレーム報告</h1>
      <p className="text-sm text-ink/50 mb-4">
        内容は事務所側で確認・対応します。報告後の進捗確認はこの画面では行いません。
      </p>

      {done && (
        <div className="mb-4 rounded-card bg-ok/10 border border-ok/30 px-4 py-3 text-sm text-ok font-medium">
          ✅ 報告を送信しました。ありがとうございました。
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">件名</label>
          <input
            className="w-full rounded-card border border-ink/15 px-4 py-3 tap-target"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：お客様よりお料理についてご指摘"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">内容</label>
          <textarea
            className="w-full rounded-card border border-ink/15 px-4 py-3 min-h-[120px]"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="状況をできるだけ詳しく書いてください"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">
            写真（任意）
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        {error && (
          <p className="text-warn text-sm bg-warn/10 rounded-card px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target w-full rounded-card bg-clay text-white font-bold text-lg py-4 shadow-sm active:scale-[0.98] transition disabled:opacity-50"
        >
          {submitting ? "送信中..." : "報告を送信"}
        </button>
      </form>
    </div>
  );
}
