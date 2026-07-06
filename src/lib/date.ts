// 日付は JST（日本時間）基準で「その日」を判定する。
// Vercel の実行環境は UTC のため、常に明示的に +09:00 オフセットで計算する。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 現在時刻をJSTのDateとして返す（内部表現はUTCのまま、日付切り出し用） */
export function nowJst(): Date {
  return new Date(Date.now() + JST_OFFSET_MS);
}

/** 日付を YYYY-MM-DD (JST) の00:00 UTC相当に正規化して保存用Dateにする */
export function normalizeDateJst(input: Date | string): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const day = jst.getUTCDate();
  // UTC基準で日付だけのDateを作る（保存キーとして使う）
  return new Date(Date.UTC(y, m, day));
}

export function todayJst(): Date {
  return normalizeDateJst(new Date());
}

export function formatDateLabel(d: Date): string {
  const jst = new Date(d.getTime());
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][jst.getUTCDay()];
  return `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}(${weekday})`;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 指定日を含む週（月曜始まり）の7日間を返す */
export function getWeekRange(anchor: Date): Date[] {
  const day = anchor.getUTCDay(); // 0=日
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor.getTime());
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime());
    d.setUTCDate(monday.getUTCDate() + i);
    days.push(d);
  }
  return days;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}
