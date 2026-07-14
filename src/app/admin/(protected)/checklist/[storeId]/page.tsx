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
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setPhotoFiles({});
    setLoading(false);
  }, [params.storeId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function changeDate(newDate: string) {
    router.push(`/admin/checklist/${params.storeId}?date=${newDate}`);
  }

  function setPassed(itemId: string, passed: boolean) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((it) => (it.id === itemId ? { ...it, passed } : it)),
      }))
    );
  }

  async function submitForm(submit: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("date", date);
      fd.append("submit", submit ? "true" : "false");
      fd.append("staffCondition", staffCondition);
      fd.append("absenceNote", absenceNote);
      fd.append("confirmedBy", confirmedBy);

      const answers = groups.flatMap((g) =>
        g.items
          .filter((it) => it.passed !== null)
          .map((it) => ({ itemId: it.id, passed: it.passed, note: it.note }))
      );
      fd.append("answers", JSON.stringify(answers));

      for (const [itemId, file] of Object.entries(photoFiles)) {
        fd.append(`photo_${itemId}`, file);
      }

      const res = await fetch(`/api/admin/checklist/${params.storeId}/save`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      setMessage(submit ? "提出済みにしました" : "保存しました");
      await load();
    } finally {
      setSaving(false);
    }
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
                  <div className="space-y-3">
                    {g.items.map((it) => (
                      <div key={it.id} className="border border-ink/10 rounded-card p-3">
                        <p className="text-sm font-semibold text-ink mb-1">{it.name}</p>
                        {it.guide && (
                          <p className="text-xs text-ink/50 mb-2 whitespace-pre-wrap">
                            {it.guide}
                          </p>
                        )}
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => setPassed(it.id, true)}
                            className={`flex-1 rounded-card py-2 text-sm font-semibold ${
                              it.passed === true ? "bg-ok text-white" : "bg-ink/5 text-ink/60"
                            }`}
                          >
                            可
                          </button>
                          <button
                            onClick={() => setPassed(it.id, false)}
                            className={`flex-1 rounded-card py-2 text-sm font-semibold ${
                              it.passed === false ? "bg-warn text-white" : "bg-ink/5 text-ink/60"
                            }`}
                          >
                            否
                          </button>
                        </div>
                        {it.passed === false && (
                          <div>
                            <p className="text-xs text-warn font-semibold mb-1">
                              ⚠ 写真の添付が必須です
                            </p>
                            {it.photoUrl && !photoFiles[it.id] && (
                              <a
                                href={it.photoUrl}
                                target="_blank"
                                className="text-xs text-moss underline block mb-1"
                              >
                                登録済みの写真を見る
                              </a>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setPhotoFiles((prev) => ({
                                  ...prev,
                                  ...(e.target.files?.[0] ? { [it.id]: e.target.files[0] } : {}),
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-card border border-ink/10 p-4">
                <p className="font-bold text-ink mb-3">体調管理記録</p>
                <label className="block text-xs font-medium text-ink/60 mb-1">
                  体調管理（当日出勤者）
                </label>
                <textarea
                  className="w-full rounded-card border border-ink/15 px-3 py-2 mb-3 min-h-[70px]"
                  value={staffCondition}
                  onChange={(e) => setStaffCondition(e.target.value)}
                />
                <label className="block text-xs font-medium text-ink/60 mb-1">
                  備考（欠勤者についてなど）
                </label>
                <textarea
                  className="w-full rounded-card border border-ink/15 px-3 py-2 mb-3 min-h-[70px]"
                  value={absenceNote}
                  onChange={(e) => setAbsenceNote(e.target.value)}
                />
                <label className="block text-xs font-medium text-ink/60 mb-1">確認者</label>
                <input
                  className="w-full rounded-card border border-ink/15 px-3 py-2"
                  value={confirmedBy}
                  onChange={(e) => setConfirmedBy(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-warn text-sm bg-warn/10 rounded-card px-3 py-2">{error}</p>
              )}
              {message && (
                <p className="text-ok text-sm bg-ok/10 rounded-card px-3 py-2">{message}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => submitForm(false)}
                  disabled={saving}
                  className="flex-1 rounded-card border border-ink/20 text-ink font-semibold py-3 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={() => submitForm(true)}
                  disabled={saving}
                  className="flex-1 rounded-card bg-clay text-white font-semibold py-3 disabled:opacity-50"
                >
                  保存して提出済みにする
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
