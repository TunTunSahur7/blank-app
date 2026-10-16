import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { todayKey, type DayKey } from './dates';
import * as db from './db';
import type { Checkin, Habit, HabitInput } from './db';
import { cancelReminders, resyncAll, syncReminders } from './reminders';

type Store = {
  ready: boolean;
  today: DayKey;
  habits: Habit[];
  /** habitId -> set of completed days */
  done: Map<number, Set<DayKey>>;
  allCheckins: () => Checkin[];
  toggle: (habitId: number, day: DayKey) => Promise<void>;
  create: (input: HabitInput) => Promise<number>;
  update: (id: number, input: HabitInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
  restore: (habits: Habit[], checkins: Checkin[]) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const sql = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDoneState] = useState<Map<number, Set<DayKey>>>(new Map());
  // Mirrors `done` synchronously so rapid taps never read a stale render.
  const doneRef = useRef(done);
  const setDone = useCallback((next: Map<number, Set<DayKey>>) => {
    doneRef.current = next;
    setDoneState(next);
  }, []);
  const [today, setToday] = useState(todayKey());

  const apply = useCallback(
    (data: { habits: Habit[]; checkins: Checkin[] }) => {
      const map = new Map<number, Set<DayKey>>();
      for (const h of data.habits) map.set(h.id, new Set());
      for (const c of data.checkins) map.get(c.habitId)?.add(c.day);
      setHabits(data.habits);
      setDone(map);
      setReady(true);
    },
    [setDone],
  );

  const reload = useCallback(async () => apply(await db.loadAll(sql)), [sql, apply]);

  useEffect(() => {
    let alive = true;
    db.loadAll(sql).then((data) => alive && apply(data));
    return () => {
      alive = false;
    };
  }, [sql, apply]);

  // Roll "today" over when the app comes back after midnight.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(todayKey());
    });
    return () => sub.remove();
  }, []);

  const toggle = useCallback(
    async (habitId: number, day: DayKey) => {
      const next = new Map(doneRef.current);
      const days = new Set(next.get(habitId));
      const nowDone = !days.has(day);
      if (nowDone) days.add(day);
      else days.delete(day);
      next.set(habitId, days);
      // Update the screen first so taps feel instant, then persist.
      setDone(next);
      try {
        await db.setCheckin(sql, habitId, day, nowDone);
      } catch (e) {
        await reload();
        throw e;
      }
    },
    [sql, reload, setDone],
  );

  const create = useCallback(
    async (input: HabitInput) => {
      const id = await db.insertHabit(sql, input, todayKey());
      await reload();
      const habit: Habit = { ...input, id, createdAt: todayKey(), sort: 0 };
      await syncReminders(habit).catch(() => {});
      return id;
    },
    [sql, reload],
  );

  const update = useCallback(
    async (id: number, input: HabitInput) => {
      await db.updateHabit(sql, id, input);
      await reload();
      await syncReminders({ ...input, id, createdAt: '', sort: 0 }).catch(() => {});
    },
    [sql, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      await db.deleteHabit(sql, id);
      await cancelReminders(id).catch(() => {});
      await reload();
    },
    [sql, reload],
  );

  const restore = useCallback(
    async (newHabits: Habit[], checkins: Checkin[]) => {
      await db.replaceAll(sql, newHabits, checkins);
      await reload();
      await resyncAll(newHabits).catch(() => {});
    },
    [sql, reload],
  );

  const allCheckins = useCallback(() => {
    const out: Checkin[] = [];
    for (const [habitId, days] of done) for (const day of days) out.push({ habitId, day });
    return out;
  }, [done]);

  const value = useMemo(
    () => ({ ready, today, habits, done, allCheckins, toggle, create, update, remove, restore }),
    [ready, today, habits, done, allCheckins, toggle, create, update, remove, restore],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useHabits(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useHabits must be used inside HabitsProvider');
  return s;
}
