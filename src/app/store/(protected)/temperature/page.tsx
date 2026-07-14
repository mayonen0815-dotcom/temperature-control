"use client";

import { useEffect, useState, useCallback } from "react";

type Item = {
  equipmentId: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  value: number | null;
  note: string;
  isAbnormal: boolean;
};

function todayStr() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export default function StoreTemperaturePage() {
  const [date, setDate] = useState(todayStr());
  const [period, setPeriod] = useState<"AM" | "PM">(
    new Date().getHours() < 15 ? "AM" : "PM"
  );
  const [items, setItems] = useState<Item[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/store/temperature?date=${date}&period=${period}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setSubmitted(!!data.submitted);
    setSubmittedBy(data.submittedBy);
    setLoading(false);
  }, [date, period]);

  useEffect(() => {
    load();
  }, [load]);

  function updateValue(equipmentId: string, value: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.equipmentId === equipmentId
          ? { ...it, value: value === "" ? null : Number(value) }
          : it
      )
    );
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await fetch("/api/store/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          period,
          entries: items.map((it) => ({
            equipmentId: it.equipmentId,
            value: it.value,
            note: it.note,
          })),
        }),
      });
      setMessage("入力内容を保存しました");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitFinal() {
    await saveDraft();
    setError("");
    setMessage("");
    const res = await fetch("/api/store/temperature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, period }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "提出に失敗しました");
      return;
    }
    setMessage("提出しました！");
    await load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-card border border-ink/15 px-3 py-2 tap-target"
        />
        <div className="flex rounded-card border border-ink/15 overflow-hidden">
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`tap-target px-4 font-semibold ${
                period === p ? "bg-moss text-white" : "bg-white text-ink/60"
              }`}
            >
              {p === "AM" ? "昼" : "夜"}
            </button>
          ))}
        </div>
      </div>

      {submitted && (
        <div className="mb-4 rounded-card bg-ok/10 border border-ok/30 px-4 py-3 text-sm text-ok font-medium">
          ✅ 提出済み（{submittedBy}）。数値を訂正した場合は再度「提出」を押してください。
        </div>
      )}

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-ink/50 text-sm">
          この店舗にはまだ設備が登録されていません。事務所側で設備を登録してください。
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.equipmentId}
              className="bg-white rounded-card border border-ink/10 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink/40">
                  基準 {item.minTemp}〜{item.maxTemp}℃
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="温度"
                  value={item.value ?? ""}
                  onChange={(e) => updateValue(item.equipmentId, e.target.value)}
                  className={`w-28 rounded-card border px-3 py-2 tap-target text-lg font-semibold ${
                    item.isAbnormal
                      ? "border-warn text-warn bg-warn/5"
                      : "border-ink/15"
                  }`}
                />
                <span className="text-ink/50">℃</span>
                {item.isAbnormal && (
                  <span className="text-warn text-xs font-semibold">
                    ⚠ 基準外
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 text-warn text-sm bg-warn/10 rounded-card px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-ok text-sm bg-ok/10 rounded-card px-3 py-2">
          {message}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-6 space-y-2">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="tap-target w-full rounded-card border border-ink/20 bg-white text-ink font-semibold py-3 disabled:opacity-50"
          >
            {saving ? "保存中..." : "一時保存"}
          </button>
          <button
            onClick={handleSubmitFinal}
            disabled={saving}
            className="tap-target w-full rounded-card bg-clay text-white font-bold text-lg py-4 shadow-sm active:scale-[0.98] transition disabled:opacity-50"
          >
            提出する
          </button>
        </div>
      )}
    </div>
  );
}
