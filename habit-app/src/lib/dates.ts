// Pure date + streak logic. Days are local calendar dates stored as 'YYYY-MM-DD'.
// Schedules are a 7-bit mask where bit 0 = Sunday ... bit 6 = Saturday.

export type DayKey = string;

const NONE: ReadonlySet<DayKey> = new Set();

export const ALL_DAYS = 0b1111111;
export const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Noon avoids DST edges shifting the date when adding days.
export function fromKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayKey(now: Date = new Date()): DayKey {
  return toKey(now);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekdayOf(key: DayKey): number {
  return fromKey(key).getDay();
}

export function isScheduled(days: number, key: DayKey): boolean {
  return (days & (1 << weekdayOf(key))) !== 0;
}

export function isValidKey(key: unknown): key is DayKey {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && toKey(fromKey(key)) === key;
}

/** The most recent scheduled day strictly before `key`, or null if the habit has no schedule. */
export function previousScheduled(days: number, key: DayKey): DayKey | null {
  if (days === 0) return null;
  let k = addDays(key, -1);
  while (!isScheduled(days, k)) k = addDays(k, -1);
  return k;
}

/**
 * Consecutive scheduled days kept, ending today. A day is kept when it was completed or
 * protected by a Streak Shield. An unfinished today doesn't break the streak — the day
 * isn't over yet.
 */
export function currentStreak(done: ReadonlySet<DayKey>, days: number, today: DayKey, shields: ReadonlySet<DayKey> = NONE): number {
  if (days === 0 || done.size === 0) return 0;
  const start = isScheduled(days, today) && !done.has(today) && !shields.has(today) ? addDays(today, -1) : today;
  return streakEndingAt(done, days, start, shields);
}

/** Consecutive scheduled days kept, counting back from `key` (inclusive). */
export function streakEndingAt(done: ReadonlySet<DayKey>, days: number, key: DayKey, shields: ReadonlySet<DayKey> = NONE): number {
  if (days === 0 || done.size === 0) return 0;
  const earliest = minKey(done);
  let streak = 0;
  for (let k = key; k >= earliest; k = addDays(k, -1)) {
    if (!isScheduled(days, k)) continue;
    if (done.has(k)) streak++;
    else if (!shields.has(k)) break;
  }
  return streak;
}

export function bestStreak(done: ReadonlySet<DayKey>, days: number, today: DayKey, shields: ReadonlySet<DayKey> = NONE): number {
  if (days === 0 || done.size === 0) return 0;
  let best = 0;
  let run = 0;
  for (let key = minKey(done); key <= today; key = addDays(key, 1)) {
    if (!isScheduled(days, key)) continue;
    if (done.has(key)) {
      run++;
      if (run > best) best = run;
    } else if (key !== today && !shields.has(key)) {
      run = 0;
    }
  }
  return best;
}

/**
 * A streak that broke on the last scheduled day and can still be repaired with a shield:
 * the missed day and the streak it would restore. Only offered for streaks worth saving.
 */
export function rescuable(
  done: ReadonlySet<DayKey>,
  days: number,
  today: DayKey,
  shields: ReadonlySet<DayKey> = NONE,
  minimum = 3,
): { day: DayKey; streak: number } | null {
  const missed = previousScheduled(days, today);
  if (!missed || done.has(missed) || shields.has(missed)) return null;
  const before = previousScheduled(days, missed);
  if (!before) return null;
  const streak = streakEndingAt(done, days, before, shields);
  if (streak < minimum) return null;
  return { day: missed, streak: streak + (done.has(today) ? 1 : 0) };
}

/** Share of scheduled days in [from, to] that were completed, 0..1. */
export function completionRate(done: ReadonlySet<DayKey>, days: number, from: DayKey, to: DayKey): number {
  let scheduled = 0;
  let hit = 0;
  for (let key = from; key <= to; key = addDays(key, 1)) {
    if (!isScheduled(days, key)) continue;
    scheduled++;
    if (done.has(key)) hit++;
  }
  return scheduled === 0 ? 0 : hit / scheduled;
}

export type DayLabels = { everyDay: string; weekdaysOnly: string; weekends: string; weekdaysShort: string[] };

const EN_LABELS: DayLabels = { everyDay: 'Every day', weekdaysOnly: 'Weekdays', weekends: 'Weekends', weekdaysShort: WEEKDAY_SHORT };

export function describeDays(days: number, labels: DayLabels = EN_LABELS): string {
  if (days === ALL_DAYS) return labels.everyDay;
  if (days === 0b0111110) return labels.weekdaysOnly;
  if (days === 0b1000001) return labels.weekends;
  return labels.weekdaysShort.filter((_, i) => days & (1 << i)).join(', ');
}

function minKey(keys: ReadonlySet<DayKey>): DayKey {
  let min: DayKey | null = null;
  for (const k of keys) if (min === null || k < min) min = k;
  return min as DayKey;
}
