"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  equipmentId: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  value: number | null;
  note: string;
  isAbnormal: boolean;
  editedByAdmin: boolean;
};

type PeriodData = {
  submitted: boolean;
  submittedBy: string | null;
  submittedByAdmin: boolean;
  items: Item[];
};

function PeriodPanel({
  label,
  period,
  data,
  storeId,
  date,
  onSaved,
}: {
  label: string;
  period: "AM" | "PM";
  data: PeriodData;
  storeId: string;
  date: string;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<Item[]>(data.items);
  const [saving, setSaving] = useState(false);

  useEffect(() => setItems(data.items), [data.items]);

  function updateValue(equipmentId: string, value: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.equipmentId === equipmentId
          ? { ...it, value: value === "" ? null : Number(value) }
          : it
      )
    );
  }

  async function save(submit: boolean) {
    setSaving(true);
    try {
      await fetch(`/api/admin/temperature/${storeId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          period,
          submit,
          entries: items.map((it) => ({
            equipmentId: it.equipmentId,
            value: it.value,
            note: it.note,
          })),
        }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`${label}の記録を削除します。よろしいですか？（元に戻せません）`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/temperature/${storeId}/save`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, period }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-card border border-ink/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-ink">{label}</h2>
        {data.submitted ? (
          <span className="text-xs font-semibold text-ok bg-ok/10 rounded-full px-3 py-1">
            提出済み・{data.submittedBy}
          </span>
        ) : (
          <span className="text-xs font-semibold text-warn bg-warn/10 rounded-full px-3 py-1">
            未提出
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.equipmentId}
            className="flex items-center justify-between gap-3 border border-ink/10 rounded-card px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="text-xs text-ink/40">
                基準 {item.minTemp}〜{item.maxTemp}℃
                {item.editedByAdmin && "　（事務所代筆）"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={item.value ?? ""}
                onChange={(e) => updateValue(item.equipmentId, e.target.value)}
                className={`w-24 rounded-card border px-2 py-1.5 text-right font-semibold ${
                  item.isAbnormal ? "border-warn text-warn" : "border-ink/15"
                }`}
              />
              <span className="text-ink/50 text-sm">℃</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="flex-1 rounded-card border border-ink/20 text-ink font-semibold py-2 text-sm disabled:opacity-50"
        >
          保存
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="flex-1 rounded-card bg-clay text-white font-semibold py-2 text-sm disabled:opacity-50"
        >
          保存して提出済みにする
        </button>
      </div>
      {data.submitted && (
        <button
          onClick={remove}
          disabled={saving}
          className="w-full mt-2 rounded-card border border-warn/40 text-warn font-semibold py-2 text-sm disabled:opacity-50"
        >
          この記録を削除する
        </button>
      )}
    </div>
  );
}

export default function AdminTemperatureDetailPage() {
  const params = useParams<{ storeId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const [storeInfo, setStoreInfo] = useState<{ name: string; storeCode: string } | null>(null);
  const [am, setAm] = useState<PeriodData | null>(null);
  const [pm, setPm] = useState<PeriodData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/temperature/${params.storeId}?date=${date}`);
    const data = await res.json();
    setStoreInfo(data.store);
    setAm(data.AM);
    setPm(data.PM);
    setLoading(false);
  }, [params.storeId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function changeDate(newDate: string) {
    router.push(`/admin/temperature/${params.storeId}?date=${newDate}`);
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-ink/50 mb-3 inline-block">
        ← 提出状況に戻る
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {storeInfo?.name ?? "..."}
          </h1>
          <p className="text-xs text-ink/40">{storeInfo?.storeCode}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded-card border border-ink/15 px-3 py-2"
        />
      </div>

      {loading || !am || !pm ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <PeriodPanel
            label="朝（AM）"
            period="AM"
            data={am}
            storeId={params.storeId}
            date={date}
            onSaved={load}
          />
          <PeriodPanel
            label="夜（PM）"
            period="PM"
            data={pm}
            storeId={params.storeId}
            date={date}
            onSaved={load}
          />
        </div>
      )}
    </div>
  );
}
