"use client";

import { useState } from "react";

const DOC_TYPES = ["健康診断書", "誓約書", "履歴書", "資格証", "その他"];

type Slot = { docType: string; file: File | null };

function emptySlots(): Slot[] {
  return [
    { docType: DOC_TYPES[0], file: null },
    { docType: DOC_TYPES[0], file: null },
    { docType: DOC_TYPES[0], file: null },
  ];
}

export default function StoreDocumentsPage() {
  const [staffName, setStaffName] = useState("");
  const [slots, setSlots] = useState<Slot[]>(emptySlots());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function updateSlot(index: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const filled = slots.filter((s) => s.file);
    if (filled.length === 0) {
      setError("ファイルを1つ以上選択してください");
      return;
    }

    setSubmitting(true);
    try {
      for (const slot of filled) {
        const fd = new FormData();
        fd.append("staffName", staffName);
        fd.append("docType", slot.docType);
        fd.append("file", slot.file as File);

        const res = await fetch("/api/store/documents", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "送信に失敗しました");
          return;
        }
      }
      setStaffName("");
      setSlots(emptySlots());
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-ink mb-1">書類提出</h1>
      <p className="text-sm text-ink/50 mb-4">
        従業員の書類（健康診断書・誓約書など）を、一度に最大3件まで提出できます。
      </p>

      {done && (
        <div className="mb-4 rounded-card bg-ok/10 border border-ok/30 px-4 py-3 text-sm text-ok font-medium">
          ✅ 書類を提出しました。
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">対象者名</label>
          <input
            className="w-full rounded-card border border-ink/15 px-4 py-3 tap-target"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="例：田中太郎"
            required
          />
        </div>

        {slots.map((slot, i) => (
          <div key={i} className="bg-white rounded-card border border-ink/10 p-4">
            <p className="text-sm font-semibold text-ink/70 mb-3">書類 {i + 1}（任意）</p>
            <label className="block text-sm font-medium text-ink/70 mb-1">書類種別</label>
            <select
              className="w-full rounded-card border border-ink/15 px-4 py-3 tap-target mb-3"
              value={slot.docType}
              onChange={(e) => updateSlot(i, { docType: e.target.value })}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium text-ink/70 mb-1">ファイル</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => updateSlot(i, { file: e.target.files?.[0] ?? null })}
              className="w-full text-sm"
            />
          </div>
        ))}

        {error && (
          <p className="text-warn text-sm bg-warn/10 rounded-card px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target w-full rounded-card bg-clay text-white font-bold text-lg py-4 shadow-sm active:scale-[0.98] transition disabled:opacity-50"
        >
          {submitting ? "送信中..." : "提出する"}
        </button>
      </form>
    </div>
  );
}
