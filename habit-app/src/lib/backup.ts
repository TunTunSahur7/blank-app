import { ALL_DAYS, isValidKey } from './dates';
import type { Checkin, Habit } from './db';

export const BACKUP_FORMAT = 'daymark-backup';
export const BACKUP_VERSION = 1;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  habits: Habit[];
  checkins: Checkin[];
};

export function buildBackup(habits: Habit[], checkins: Checkin[], now = new Date()): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), habits, checkins };
}

/** Parses and validates a backup file. Throws a user-readable Error if it isn't one. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a Daymark backup.");
  }
  const b = data as Partial<Backup>;
  if (!b || b.format !== BACKUP_FORMAT || !Array.isArray(b.habits) || !Array.isArray(b.checkins)) {
    throw new Error("This file isn't a Daymark backup.");
  }
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of Daymark. Update the app and try again.');
  }

  const habits: Habit[] = b.habits.map((h, i) => {
    const ok =
      h && Number.isInteger(h.id) && typeof h.name === 'string' && h.name.trim() !== '' &&
      typeof h.emoji === 'string' && typeof h.color === 'string' &&
      Number.isInteger(h.days) && h.days >= 0 && h.days <= ALL_DAYS &&
      (h.reminder === null || (typeof h.reminder === 'string' && /^\d{2}:\d{2}$/.test(h.reminder))) &&
      isValidKey(h.createdAt);
    if (!ok) throw new Error(`Habit #${i + 1} in the backup is damaged.`);
    return {
      id: h.id, name: h.name, emoji: h.emoji, color: h.color, days: h.days,
      reminder: h.reminder, createdAt: h.createdAt, sort: Number.isInteger(h.sort) ? h.sort : i,
    };
  });

  const ids = new Set(habits.map((h) => h.id));
  if (ids.size !== habits.length) throw new Error('The backup has duplicate habits.');
  const checkins = b.checkins.filter(
    (c): c is Checkin => !!c && ids.has(c.habitId) && isValidKey(c.day),
  );

  return { format: BACKUP_FORMAT, version: b.version, exportedAt: String(b.exportedAt ?? ''), habits, checkins };
}
