"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Equipment = {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  active: boolean;
};

export default function StoreEquipmentPage() {
  const params = useParams<{ storeId: string }>();
  const [tab, setTab] = useState<"equipment" | "checklist">("equipment");
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${params.storeId}/equipment`);
    const data = await res.json();
    setEquipments((data.equipments ?? []).filter((e: Equipment) => e.active));
    setLoading(false);
  }, [params.storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/stores/${params.storeId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, minTemp, maxTemp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "追加に失敗しました");
        return;
      }
      setName("");
      setMinTemp("");
      setMaxTemp("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この設備を削除しますか？（過去の記録は残ります）")) return;
    await fetch(`/api/admin/equipment/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <Link href="/admin/stores" className="text-sm text-ink/50 mb-3 inline-block">
        ← 店舗一覧に戻る
      </Link>
      <h1 className="text-xl font-bold text-ink mb-4">設備・重点管理項目</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("equipment")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            tab === "equipment" ? "bg-ink text-white" : "bg-white text-ink/60 border border-ink/10"
          }`}
        >
          設備管理（温度）
        </button>
        <button
          onClick={() => setTab("checklist")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            tab === "checklist" ? "bg-ink text-white" : "bg-white text-ink/60 border border-ink/10"
          }`}
        >
          重点管理項目
        </button>
      </div>

      {tab === "checklist" ? (
        <ChecklistManager storeId={params.storeId} />
      ) : (
      <>
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">設備名</label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-48"
            placeholder="例：冷蔵庫①"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            基準温度 最小(℃)
          </label>
          <input
            type="number"
            step="0.1"
            className="rounded-card border border-ink/15 px-3 py-2 w-24"
            value={minTemp}
            onChange={(e) => setMinTemp(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            基準温度 最大(℃)
          </label>
          <input
            type="number"
            step="0.1"
            className="rounded-card border border-ink/15 px-3 py-2 w-24"
            value={maxTemp}
            onChange={(e) => setMaxTemp(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-moss text-white font-semibold px-5 py-2 disabled:opacity-50"
        >
          設備を追加
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : equipments.length === 0 ? (
        <p className="text-ink/50 text-sm">まだ設備が登録されていません。</p>
      ) : (
        <div className="bg-white rounded-card border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-ink/50">
                <th className="px-4 py-3">設備名</th>
                <th className="px-4 py-3">基準温度</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {equipments.map((eq) => (
                <tr key={eq.id} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{eq.name}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {eq.minTemp}℃ 〜 {eq.maxTemp}℃
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-warn text-sm hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function ChecklistManager({ storeId }: { storeId: string }) {
  const [groups, setGroups] = useState<
    {
      id: string;
      name: string;
      referencePhotoUrl: string | null;
      items: { id: string; name: string; guide: string | null }[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});
  const [newItemGuide, setNewItemGuide] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${storeId}/checklist-groups`);
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newGroupName.trim()) return;
    const res = await fetch(`/api/admin/stores/${storeId}/checklist-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "追加に失敗しました");
      return;
    }
    setNewGroupName("");
    await load();
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("このグループを削除しますか？（過去の記録は残ります）")) return;
    await fetch(`/api/admin/checklist-groups/${groupId}`, { method: "DELETE" });
    await load();
  }

  async function addItem(groupId: string) {
    const name = newItemName[groupId];
    if (!name || !name.trim()) return;
    const res = await fetch(`/api/admin/checklist-groups/${groupId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, guide: newItemGuide[groupId] ?? "" }),
    });
    if (res.ok) {
      setNewItemName((prev) => ({ ...prev, [groupId]: "" }));
      setNewItemGuide((prev) => ({ ...prev, [groupId]: "" }));
      await load();
    }
  }

  async function uploadGroupPhoto(groupId: string, file: File) {
    setUploadingPhoto(groupId);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await fetch(`/api/admin/checklist-groups/${groupId}/photo`, {
        method: "POST",
        body: fd,
      });
      await load();
    } finally {
      setUploadingPhoto(null);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("この項目を削除しますか？（過去の記録は残ります）")) return;
    await fetch(`/api/admin/checklist-items/${itemId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <form
        onSubmit={addGroup}
        className="bg-white rounded-card border border-ink/10 p-4 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-ink/60 mb-1">
            新しいグループ名
          </label>
          <input
            className="rounded-card border border-ink/15 px-3 py-2 w-72"
            placeholder="例：第1グループ：非加熱のもの"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded-card bg-moss text-white font-semibold px-5 py-2"
        >
          グループを追加
        </button>
        {error && <p className="text-warn text-sm w-full">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">読み込み中...</p>
      ) : groups.length === 0 ? (
        <p className="text-ink/50 text-sm">まだグループが登録されていません。</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-card border border-ink/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-ink">{g.name}</p>
                <button
                  onClick={() => deleteGroup(g.id)}
                  className="text-warn text-xs hover:underline"
                >
                  グループを削除
                </button>
              </div>

              <div className="mb-3">
                {g.referencePhotoUrl && (
                  g.referencePhotoUrl.toLowerCase().endsWith(".pdf") ? (
                    <a
                      href={g.referencePhotoUrl}
                      target="_blank"
                      className="inline-block mb-2 text-sm text-moss underline"
                    >
                      📄 参考資料（PDF）を見る
                    </a>
                  ) : (
                    <a
                      href={g.referencePhotoUrl}
                      target="_blank"
                      className="block mb-2"
                    >
                      <img
                        src={g.referencePhotoUrl}
                        alt="参考写真"
                        className="w-full max-h-32 object-cover rounded-card border border-ink/10"
                      />
                    </a>
                  )
                )}
                <label className="block text-xs font-medium text-ink/60 mb-1">
                  参考写真（店舗側にも表示されます）
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={uploadingPhoto === g.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadGroupPhoto(g.id, file);
                  }}
                  className="text-sm"
                />
                {uploadingPhoto === g.id && (
                  <p className="text-xs text-ink/40 mt-1">アップロード中...</p>
                )}
              </div>

              <div className="space-y-2 mb-3">
                {g.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between border border-ink/10 rounded-card px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-ink font-medium">{it.name}</p>
                      {it.guide && (
                        <p className="text-xs text-ink/50 whitespace-pre-wrap mt-1">
                          {it.guide}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteItem(it.id)}
                      className="text-warn text-xs hover:underline shrink-0 ml-2"
                    >
                      削除
                    </button>
                  </div>
                ))}
                {g.items.length === 0 && (
                  <p className="text-xs text-ink/40">項目がまだありません</p>
                )}
              </div>
              <div className="space-y-2">
                <input
                  className="w-full rounded-card border border-ink/15 px-3 py-1.5 text-sm"
                  placeholder="項目名　例：生卵"
                  value={newItemName[g.id] ?? ""}
                  onChange={(e) =>
                    setNewItemName((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                />
                <textarea
                  className="w-full rounded-card border border-ink/15 px-3 py-1.5 text-sm min-h-[60px]"
                  placeholder="チェック方法（任意）　例：賞味期限の確認。常温で置く場合は状態を営業前・休憩中・営業後で確認する"
                  value={newItemGuide[g.id] ?? ""}
                  onChange={(e) =>
                    setNewItemGuide((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                />
                <button
                  onClick={() => addItem(g.id)}
                  className="rounded-card bg-ink/80 text-white text-sm font-semibold px-4 py-1.5"
                >
                  項目を追加
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
