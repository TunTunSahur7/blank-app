import { addDays, currentStreak, fromKey, isScheduled, type DayKey } from '../lib/dates';
import type { Habit } from '../lib/db';
import { iconFor } from '../lib/icons';
import type { TodayWidgetProps } from './TodayWidget';

type DayMap = Map<number, ReadonlySet<DayKey>>;

const EMPTY: ReadonlySet<DayKey> = new Set();
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** What the widget shows for `day`: that day's scheduled habits, their state and streaks. */
export function widgetPropsFor(habits: Habit[], done: DayMap, shields: DayMap, day: DayKey, pro: boolean): TodayWidgetProps {
  const due = habits.filter((h) => isScheduled(h.days, day));
  const items = due.map((h) => {
    const set = done.get(h.id) ?? EMPTY;
    return {
      id: h.id,
      name: h.name,
      sf: iconFor(h.icon).sf,
      color: h.color,
      done: set.has(day),
      streak: currentStreak(set, h.days, day, shields.get(h.id)),
    };
  });
  return {
    day,
    weekday: WEEKDAYS[fromKey(day).getDay()],
    // Open habits first, so the widget always shows what's left to do.
    habits: [...items.filter((i) => !i.done), ...items.filter((i) => i.done)],
    topStreak: Math.max(0, ...items.map((i) => i.streak)),
    pro,
    edits: {},
  };
}

/** Timeline: today now, then each of the next two days from midnight, so the widget rolls over on its own. */
export function widgetTimeline(habits: Habit[], done: DayMap, shields: DayMap, today: DayKey, pro: boolean) {
  return [0, 1, 2].map((offset) => {
    const day = addDays(today, offset);
    return { date: offset === 0 ? new Date() : midnight(day), props: widgetPropsFor(habits, done, shields, day, pro) };
  });
}

function midnight(day: DayKey): Date {
  const d = fromKey(day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Check-offs made on the widget, from its stored timeline, as exact states to apply. */
export function editsFrom(entries: { props: Partial<TodayWidgetProps> }[]): { habitId: number; day: DayKey; done: boolean }[] {
  const out = new Map<string, { habitId: number; day: DayKey; done: boolean }>();
  for (const e of entries) {
    const day = e.props.day;
    if (!day || !e.props.edits) continue;
    for (const [id, isDone] of Object.entries(e.props.edits)) {
      const habitId = Number(id);
      if (!Number.isInteger(habitId) || typeof isDone !== 'boolean') continue;
      out.set(`${habitId}:${day}`, { habitId, day, done: isDone });
    }
  }
  return [...out.values()];
}
