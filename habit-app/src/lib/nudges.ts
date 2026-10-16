import * as Notifications from 'expo-notifications';

import { addDays, currentStreak, fromKey, isScheduled, type DayKey } from './dates';
import type { Habit } from './db';

const PREFIX = 'nudge-';
const DAYS_AHEAD = 7;

export const DEFAULT_NUDGE_TIME = '20:00';

type Plan = {
  enabled: boolean;
  time: string;
  habits: Habit[];
  done: Map<number, Set<DayKey>>;
  shields: Map<number, Set<DayKey>>;
  today: DayKey;
};

/**
 * Streak Guard: one evening notification per day, only while habits are still open.
 * Today's nudge names the open habits and the streak at stake; it disappears the moment
 * the last habit is checked off. Re-planned whenever check-ins change or the app opens.
 */
export async function planNudges({ enabled, time, habits, done, shields, today }: Plan): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!enabled || habits.length === 0) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const due = habits.filter((h) => isScheduled(h.days, day));
    if (due.length === 0) continue;

    const at = fromKey(day);
    at.setHours(hour, minute, 0, 0);
    if (at <= now) continue;

    let title = 'Close your day';
    let body = `${due.length === 1 ? 'One habit is' : `${due.length} habits are`} waiting. Keep your streaks going.`;

    if (i === 0) {
      const open = due.filter((h) => !done.get(h.id)?.has(day));
      if (open.length === 0) continue;
      const atStake = Math.max(
        0,
        ...open.map((h) => currentStreak(done.get(h.id) ?? new Set(), h.days, day, shields.get(h.id))),
      );
      title = atStake >= 2 ? `Keep your ${atStake}-day streak` : 'Close your day';
      const names = open.slice(0, 3).map((h) => h.name).join(', ');
      body = `${open.length === 1 ? '1 habit' : `${open.length} habits`} left today: ${names}${open.length > 3 ? '…' : '.'}`;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${day}`,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
}
