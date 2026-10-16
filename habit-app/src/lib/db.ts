import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from './dates';

export const DATABASE_NAME = 'daymark.db';

export type Habit = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  /** Weekday bitmask, bit 0 = Sunday. */
  days: number;
  /** 'HH:MM' local time, or null for no reminder. */
  reminder: string | null;
  createdAt: DayKey;
  sort: number;
};

export type HabitInput = Omit<Habit, 'id' | 'createdAt' | 'sort'>;

export type Checkin = { habitId: number; day: DayKey };

type HabitRow = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  days: number;
  reminder: string | null;
  created_at: string;
  sort: number;
};

// Each entry upgrades the schema by one version. Never edit a shipped entry —
// append a new one, so existing users' data is carried forward.
const MIGRATIONS: string[] = [
  `CREATE TABLE habits (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     emoji TEXT NOT NULL,
     color TEXT NOT NULL,
     days INTEGER NOT NULL,
     reminder TEXT,
     created_at TEXT NOT NULL,
     sort INTEGER NOT NULL DEFAULT 0
   );
   CREATE TABLE checkins (
     habit_id INTEGER NOT NULL,
     day TEXT NOT NULL,
     PRIMARY KEY (habit_id, day)
   );`,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

const fromRow = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  color: r.color,
  days: r.days,
  reminder: r.reminder,
  createdAt: r.created_at,
  sort: r.sort,
});

export async function loadAll(db: SQLiteDatabase): Promise<{ habits: Habit[]; checkins: Checkin[] }> {
  const habits = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY sort, id');
  const checkins = await db.getAllAsync<{ habit_id: number; day: string }>('SELECT habit_id, day FROM checkins');
  return {
    habits: habits.map(fromRow),
    checkins: checkins.map((c) => ({ habitId: c.habit_id, day: c.day })),
  };
}

export async function insertHabit(db: SQLiteDatabase, h: HabitInput, createdAt: DayKey): Promise<number> {
  const max = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(sort) AS m FROM habits');
  const res = await db.runAsync(
    'INSERT INTO habits (name, emoji, color, days, reminder, created_at, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
    h.name, h.emoji, h.color, h.days, h.reminder, createdAt, (max?.m ?? 0) + 1,
  );
  return res.lastInsertRowId;
}

export async function updateHabit(db: SQLiteDatabase, id: number, h: HabitInput): Promise<void> {
  await db.runAsync(
    'UPDATE habits SET name = ?, emoji = ?, color = ?, days = ?, reminder = ? WHERE id = ?',
    h.name, h.emoji, h.color, h.days, h.reminder, id,
  );
}

export async function deleteHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM checkins WHERE habit_id = ?', id);
    await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  });
}

export async function setCheckin(db: SQLiteDatabase, habitId: number, day: DayKey, done: boolean): Promise<void> {
  if (done) {
    await db.runAsync('INSERT OR IGNORE INTO checkins (habit_id, day) VALUES (?, ?)', habitId, day);
  } else {
    await db.runAsync('DELETE FROM checkins WHERE habit_id = ? AND day = ?', habitId, day);
  }
}

/** Replaces everything with the given data, atomically. Used by backup restore. */
export async function replaceAll(db: SQLiteDatabase, habits: Habit[], checkins: Checkin[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM checkins; DELETE FROM habits;');
    for (const h of habits) {
      await db.runAsync(
        'INSERT INTO habits (id, name, emoji, color, days, reminder, created_at, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        h.id, h.name, h.emoji, h.color, h.days, h.reminder, h.createdAt, h.sort,
      );
    }
    for (const c of checkins) {
      await db.runAsync('INSERT OR IGNORE INTO checkins (habit_id, day) VALUES (?, ?)', c.habitId, c.day);
    }
  });
}
