// Pure date + streak logic. Days are local calendar dates stored as 'YYYY-MM-DD'.
// Schedules are a 7-bit mask where bit 0 = Sunday ... bit 6 = Saturday.

export type DayKey = string;

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

/**
 * Consecutive scheduled days completed, ending today. Today counts if done,
 * but an unfinished today doesn't break the streak — the day isn't over yet.
 */
export function currentStreak(done: Set<DayKey>, days: number, today: DayKey): number {
  if (days === 0 || done.size === 0) return 0;
  let streak = 0;
  let key = today;
  if (isScheduled(days, key) && !done.has(key)) key = addDays(key, -1);
  const earliest = minKey(done);
  while (key >= earliest) {
    if (isScheduled(days, key)) {
      if (!done.has(key)) break;
      streak++;
    }
    key = addDays(key, -1);
  }
  return streak;
}

export function bestStreak(done: Set<DayKey>, days: number, today: DayKey): number {
  if (days === 0 || done.size === 0) return 0;
  let best = 0;
  let run = 0;
  for (let key = minKey(done); key <= today; key = addDays(key, 1)) {
    if (!isScheduled(days, key)) continue;
    if (done.has(key)) {
      run++;
      if (run > best) best = run;
    } else if (key !== today) {
      run = 0;
    }
  }
  return best;
}

/** Share of scheduled days in [from, to] that were completed, 0..1. */
export function completionRate(done: Set<DayKey>, days: number, from: DayKey, to: DayKey): number {
  let scheduled = 0;
  let hit = 0;
  for (let key = from; key <= to; key = addDays(key, 1)) {
    if (!isScheduled(days, key)) continue;
    scheduled++;
    if (done.has(key)) hit++;
  }
  return scheduled === 0 ? 0 : hit / scheduled;
}

export function describeDays(days: number): string {
  if (days === ALL_DAYS) return 'Every day';
  if (days === 0b0111110) return 'Weekdays';
  if (days === 0b1000001) return 'Weekends';
  return WEEKDAY_SHORT.filter((_, i) => days & (1 << i)).join(', ');
}

function minKey(keys: Set<DayKey>): DayKey {
  let min: DayKey | null = null;
  for (const k of keys) if (min === null || k < min) min = k;
  return min as DayKey;
}
