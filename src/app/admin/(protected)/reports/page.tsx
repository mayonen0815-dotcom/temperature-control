"use client";

import { useCallback, useEffect, useState } from "react";

type ReportData = {
  store: { id: string; name: string; storeCode: string };
  days: string[];
  equipments: { id: string; name: string }[];
  temperatureLogs: {
    equipmentId: string;
    logDate: string;
    period: "AM" | "PM";
    value: number;
    isAbnormal: boolean;
  }[];
  checklistGroups: { id: string; name: string; items: { id: string; name: string }[] }[];
  checklistAnswers: { itemId: string; logDate: string; passed: boolean }[];
  checklistSubmissions: {
    logDate: string;
    staffCondition: string;
    absenceNote: string | null;
    confirmedBy: string;
  }[];
};

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getUTCDay()];
  return `${d.getUTCDate()}(${weekday})`;
}

function currentMonth() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function AdminReportsPage() {
  const [stores, setStores] = useState<{ id: string; name: string; storeCode: string }[]>([]);
  const [storeId, setStoreId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stores")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.stores ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          storeCode: s.storeCode,
        }));
        setStores(list);
        if (list[0]) setStoreId(list[0].id);
      });
  }, []);

  const loadReport = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/reports/${storeId}?month=${month}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [storeId, month]);

  function valueFor(equipmentId: string, day: string, period: "AM" | "PM") {
    const log = data?.temperatureLogs.find(
      (l) => l.equipmentId === equipmentId && l.logDate === day && l.period === period
    );
    if (!log) return "-";
    return `${log.value}${log.isAbnormal ? "⚠" : ""}`;
  }

  function passedFor(itemId: string, day: string) {
    const a = data?.checklistAnswers.find((x) => x.itemId === itemId && x.logDate === day);
    if (!a) return "-";
    return a.passed ? "可" : "否";
  }

  function submissionFor(day: string) {
    return data?.checklistSubmissions.find((s) => s.logDate === day) ?? null;
  }

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-xl font-bold text-ink mb-6">月次レポート</h1>
        <div className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">店舗</label>
            <select
              className="rounded-card border border-ink/15 px-3 py-2 w-64"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.storeCode}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1">対象月</label>
            <input
              type="month"
              className="rounded-card border border-ink/15 px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <button
            onClick={loadReport}
            disabled={loading || !storeId}
            className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "レポートを表示"}
          </button>
          {data && (
            <button
              onClick={() => window.print()}
              className="rounded-card bg-clay text-white font-semibold px-5 py-2"
            >
              印刷 / PDFとして保存
            </button>
          )}
        </div>
        <p className="text-xs text-ink/40 mb-6">
          「印刷 / PDFとして保存」を押すと、ブラウザの印刷画面が開きます。送信先（プリンター）の欄で
          「PDFに保存」を選ぶとPDFファイルとして保存できます。
        </p>
      </div>

      {data && (
        <div className="space-y-8">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-ink">
              {data.store.name}（{data.store.storeCode}）　{month} 月次記録
            </h2>
          </div>

          <div>
            <p className="font-bold text-ink mb-2">温度記録表</p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5">日付</th>
                    {data.equipments.map((eq) => (
                      <th
                        key={eq.id}
                        colSpan={2}
                        className="border border-ink/20 px-2 py-1 bg-ink/5"
                      >
                        {eq.name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5"></th>
                    {data.equipments.flatMap((eq) => [
                      <th key={eq.id + "-am"} className="border border-ink/20 px-2 py-1 bg-ink/5">
                        昼
                      </th>,
                      <th key={eq.id + "-pm"} className="border border-ink/20 px-2 py-1 bg-ink/5">
                        夜
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {data.days.map((day) => (
                    <tr key={day}>
                      <td className="border border-ink/20 px-2 py-1 font-semibold">
                        {formatDay(day)}
                      </td>
                      {data.equipments.flatMap((eq) => [
                        <td key={eq.id + "-am"} className="border border-ink/20 px-2 py-1 text-center">
                          {valueFor(eq.id, day, "AM")}
                        </td>,
                        <td key={eq.id + "-pm"} className="border border-ink/20 px-2 py-1 text-center">
                          {valueFor(eq.id, day, "PM")}
                        </td>,
                      ])}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="break-before-page">
            <p className="font-bold text-ink mb-2">重点管理記録表</p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5">日付</th>
                    {data.checklistGroups.flatMap((g) =>
                      g.items.map((it) => (
                        <th key={it.id} className="border border-ink/20 px-2 py-1 bg-ink/5">
                          {it.name}
                        </th>
                      ))
                    )}
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5">体調管理</th>
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5">備考</th>
                    <th className="border border-ink/20 px-2 py-1 bg-ink/5">確認者</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.map((day) => {
                    const sub = submissionFor(day);
                    return (
                      <tr key={day}>
                        <td className="border border-ink/20 px-2 py-1 font-semibold">
                          {formatDay(day)}
                        </td>
                        {data.checklistGroups.flatMap((g) =>
                          g.items.map((it) => (
                            <td
                              key={it.id}
                              className="border border-ink/20 px-2 py-1 text-center"
                            >
                              {passedFor(it.id, day)}
                            </td>
                          ))
                        )}
                        <td className="border border-ink/20 px-2 py-1">
                          {sub?.staffCondition || "-"}
                        </td>
                        <td className="border border-ink/20 px-2 py-1">
                          {sub?.absenceNote || "-"}
                        </td>
                        <td className="border border-ink/20 px-2 py-1">
                          {sub?.confirmedBy || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
