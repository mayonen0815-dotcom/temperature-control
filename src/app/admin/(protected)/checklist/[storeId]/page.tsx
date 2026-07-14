"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  name: string;
  guide: string | null;
  passed: boolean | null;
  photoUrl: string | null;
  note: string;
};
type Group = { id: string; name: string; referencePhotoUrl: string | null; items: Item[] };

export default function AdminChecklistViewPage() {
  const params = useParams<{ storeId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const [storeInfo, setStoreInfo] = useState<{ name: string; storeCode: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);
  const [staffCondition, setStaffCondition] = useState("");
  const [absenceNote, setAbsenceNote] = useState("");
  const [confirmedBy, setConfirmedBy] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/checklist/${params.storeId}?date=${date}`);
    const data = await res.json();
    setStoreInfo(data.store);
    setGroups(data.groups ?? []);
    setSubmitted(!!data.submitted);
    setSubmittedBy(data.submittedBy);
    setStaffCondition(data.staffCondition ?? "");
    setAbsenceNote(data.absenceNote ?? "");
    setConfirmedBy(data.confirmedBy ?? "");
    setLoading(false);
  }, [params.storeId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function changeDate(newDate: string) {
    router.push(`/admin/checklist/${params.storeId}?date=${newDate}`);
  }

  return (
    <div>
      <Link href="/admin/stores" className="text-sm text-ink/50 mb-3 inline-block">
        ← 店舗一覧に戻る
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {storeInfo?.name ?? "..."}　重点管理記録
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

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : (
        <>
          <div className="mb-4">
            {submitted ? (
              <span className="text-xs font-semibold text-ok bg-ok/10 rounded-full px-3 py-1">
                提出済み・{submittedBy}
              </span>
            ) : (
              <span className="text-xs font-semibold text-warn bg-warn/10 rounded-full px-3 py-1">
                未提出
              </span>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="text-ink/50 text-sm">この店舗にはまだ項目が登録されていません。</p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.id} className="bg-white rounded-card border border-ink/10 p-4">
                  <p className="font-bold text-ink mb-2">{g.name}</p>
                  {g.referencePhotoUrl && (
                    <a href={g.referencePhotoUrl} target="_blank" className="block mb-3">
                      <img
                        src={g.referencePhotoUrl}
                        alt="参考写真"
                        className="w-full max-h-32 object-cover rounded-card border border-ink/10"
                      />
                    </a>
                  )}
                  <div className="space-y-2">
                    {g.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between border border-ink/10 rounded-card px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-ink">{it.name}</p>
                          {it.guide && (
                            <p className="text-xs text-ink/50 whitespace-pre-wrap">{it.guide}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {it.passed === null ? (
                            <span className="text-xs text-ink/40">未回答</span>
                          ) : it.passed ? (
                            <span className="text-ok font-bold text-sm">可</span>
                          ) : (
                            <span className="text-warn font-bold text-sm">否</span>
                          )}
                          {it.photoUrl && (
                            <a
                              href={it.photoUrl}
                              target="_blank"
                              className="text-xs text-moss underline"
                            >
                              写真
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-card border border-ink/10 p-4">
                <p className="font-bold text-ink mb-3">体調管理記録</p>
                <p className="text-xs text-ink/50 mb-1">体調管理（当日出勤者）</p>
                <p className="text-sm text-ink mb-3 whitespace-pre-wrap">
                  {staffCondition || "（未入力）"}
                </p>
                <p className="text-xs text-ink/50 mb-1">備考</p>
                <p className="text-sm text-ink mb-3 whitespace-pre-wrap">
                  {absenceNote || "（未入力）"}
                </p>
                <p className="text-xs text-ink/50 mb-1">確認者</p>
                <p className="text-sm text-ink">{confirmedBy || "（未入力）"}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
