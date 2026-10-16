import * as Notifications from 'expo-notifications';

import type { Habit } from './db';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const prefix = (habitId: number) => `habit-${habitId}-`;

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelReminders(habitId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix(habitId)))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Makes the scheduled notifications for a habit match its current settings. */
export async function syncReminders(habit: Habit): Promise<void> {
  await cancelReminders(habit.id);
  if (!habit.reminder || habit.days === 0) return;
  const granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) return;

  const [hour, minute] = habit.reminder.split(':').map(Number);
  for (let day = 0; day < 7; day++) {
    if (!(habit.days & (1 << day))) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${prefix(habit.id)}${day}`,
      content: { title: habit.name, body: "Time for today's check-in." },
      // expo-notifications weekdays are 1 = Sunday ... 7 = Saturday.
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: day + 1, hour, minute },
    });
  }
}

export async function resyncAll(habits: Habit[]): Promise<void> {
  // Only habit reminders: the trial reminder and Streak Guard nudges are managed elsewhere.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith('habit-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const h of habits) await syncReminders(h);
}
