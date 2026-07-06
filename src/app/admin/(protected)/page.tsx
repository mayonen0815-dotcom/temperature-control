"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type DayStatus = { date: string; am: boolean; pm: boolean; complete: boolean };
type StoreRow = {
  storeId: string;
  storeCode: string;
  storeName: string;
  hasEquipment: boolean;
  days: DayStatus[];
};

function todayIso() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatHeader(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getUTCDay()];
  return { md: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, weekday };
}

export default function AdminDashboardPage() {
  const [anchor, setAnchor] = useState(todayIso());
  const [days, setDays] = useState<string[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/status-grid?anchor=${anchor}`);
    const data = await res.json();
    setDays(data.days ?? []);
    setStores(data.stores ?? []);
    setLoading(false);
  }, [anchor]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftWeek(delta: number) {
    const d = new Date(anchor + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta * 7);
    setAnchor(d.toISOString().slice(0, 10));
  }

  const rangeLabel =
    days.length === 7
      ? `${formatHeader(days[0]).md} 〜 ${formatHeader(days[6]).md}`
      : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">温度管理 提出状況</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftWeek(-1)}
            className="rounded-card border border-ink/15 px-3 py-1.5 text-sm text-ink/70 hover:bg-ink/5"
          >
            ◀ 前の週
          </button>
          <span className="font-semibold text-ink">{rangeLabel}</span>
          <button
            onClick={() => shiftWeek(1)}
            className="rounded-card border border-ink/15 px-3 py-1.5 text-sm text-ink/70 hover:bg-ink/5"
          >
            次の週 ▶
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="text-left px-4 py-3 text-ink/60 font-medium sticky left-0 bg-white">
                  店舗
                </th>
                {days.map((d) => {
                  const { md, weekday } = formatHeader(d);
                  const isToday = d === todayIso();
                  return (
                    <th
                      key={d}
                      className={`px-4 py-3 font-medium min-w-[84px] ${
                        isToday ? "text-moss" : "text-ink/60"
                      }`}
                    >
                      <div className="text-base">{md}</div>
                      <div className="text-xs">{weekday}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {stores.map((store, i) => (
                <tr
                  key={store.storeId}
                  className={i % 2 === 1 ? "bg-mist/40" : ""}
                >
                  <td className="px-4 py-3 sticky left-0 bg-inherit">
                    <p className="font-semibold text-ink">{store.storeName}</p>
                    <p className="text-xs text-ink/40">{store.storeCode}</p>
                  </td>
                  {store.days.map((d) => (
                    <td key={d.date} className="text-center px-4 py-3">
                      {!store.hasEquipment ? (
                        <span className="text-ink/30 text-xs">-</span>
                      ) : (
                        <Link
                          href={`/admin/temperature/${store.storeId}?date=${d.date}`}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            d.complete
                              ? "bg-ok/15 text-ok"
                              : "bg-warn/15 text-warn"
                          }`}
                          title={`朝:${d.am ? "済" : "未"} / 夜:${d.pm ? "済" : "未"}`}
                        >
                          {d.complete ? "○" : "×"}
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink/40 mt-3">
        ○＝朝・夜とも提出済み　×＝未提出あり（クリックで内容の確認・代筆入力ができます）
      </p>
    </div>
  );
}
