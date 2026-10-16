import { useSQLiteContext } from 'expo-sqlite';
import * as StoreReview from 'expo-store-review';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { currentStreak, todayKey, type DayKey } from './dates';
import * as db from './db';
import type { Checkin, Habit, HabitInput, Shield, Snapshot } from './db';
import { DEFAULT_NUDGE_TIME, planNudges } from './nudges';
import { cancelReminders, resyncAll, syncReminders } from './reminders';

/** Streak lengths worth a celebration. */
export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 365, 500, 730, 1000];

export type Celebration = { habit: Habit; streak: number };

type DayMap = Map<number, Set<DayKey>>;

type Store = {
  ready: boolean;
  today: DayKey;
  habits: Habit[];
  /** habitId -> completed days */
  done: DayMap;
  /** habitId -> days protected by a Streak Shield */
  shields: DayMap;
  shieldList: Shield[];
  settings: Record<string, string>;
  onboarded: boolean;
  nudgeEnabled: boolean;
  nudgeTime: string;
  celebration: Celebration | null;
  dismissCelebration: () => void;
  allCheckins: () => Checkin[];
  toggle: (habitId: number, day: DayKey) => Promise<void>;
  create: (input: HabitInput) => Promise<number>;
  update: (id: number, input: HabitInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
  applyShield: (habitId: number, day: DayKey) => Promise<void>;
  shieldsUsedThisMonth: () => number;
  setSetting: (key: string, value: string) => Promise<void>;
  restore: (habits: Habit[], checkins: Checkin[], shields: Shield[]) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

const REVIEW_KEY = 'review_requested_at';
const REVIEW_EVERY_DAYS = 120;

function toMap(habits: Habit[], rows: { habitId: number; day: DayKey }[]): DayMap {
  const map: DayMap = new Map();
  for (const h of habits) map.set(h.id, new Set());
  for (const r of rows) map.get(r.habitId)?.add(r.day);
  return map;
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const sql = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDoneState] = useState<DayMap>(new Map());
  const [shieldList, setShieldList] = useState<Shield[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [today, setToday] = useState(todayKey());
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  // Mirrors of state, read synchronously so rapid taps never act on a stale render.
  const doneRef = useRef(done);
  const settingsRef = useRef(settings);
  const setDone = useCallback((next: DayMap) => {
    doneRef.current = next;
    setDoneState(next);
  }, []);

  const shields = useMemo(() => toMap(habits, shieldList), [habits, shieldList]);

  const apply = useCallback(
    (data: Snapshot) => {
      setHabits(data.habits);
      setDone(toMap(data.habits, data.checkins));
      setShieldList(data.shields);
      settingsRef.current = data.settings;
      setSettings(data.settings);
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

  const nudgeEnabled = settings.nudge_enabled !== '0';
  const nudgeTime = settings.nudge_time ?? DEFAULT_NUDGE_TIME;

  // Keep the Streak Guard schedule in step with check-ins.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      planNudges({ enabled: nudgeEnabled, time: nudgeTime, habits, done, shields, today }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [ready, nudgeEnabled, nudgeTime, habits, done, shields, today]);

  const setSetting = useCallback(
    async (key: string, value: string) => {
      settingsRef.current = { ...settingsRef.current, [key]: value };
      setSettings(settingsRef.current);
      await db.setSetting(sql, key, value);
    },
    [sql],
  );

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

      if (!nowDone || day !== todayKey()) return;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const streak = currentStreak(days, habit.days, day, shields.get(habitId));
      const key = `milestone:${habitId}:${streak}`;
      if (MILESTONES.includes(streak) && !settingsRef.current[key]) {
        setCelebration({ habit, streak });
        await setSetting(key, day);
      }
    },
    [sql, reload, setDone, habits, shields, setSetting],
  );

  const dismissCelebration = useCallback(() => {
    const c = celebration;
    setCelebration(null);
    // Ask for a rating at a moment of pride, never more than every few months.
    // iOS also caps how often the prompt can appear.
    if (!c || c.streak < 7) return;
    const last = settingsRef.current[REVIEW_KEY];
    if (last && Date.now() - Number(last) < REVIEW_EVERY_DAYS * 86400000) return;
    setTimeout(async () => {
      if (await StoreReview.isAvailableAsync().catch(() => false)) {
        await StoreReview.requestReview().catch(() => {});
        await setSetting(REVIEW_KEY, String(Date.now()));
      }
    }, 700);
  }, [celebration, setSetting]);

  const create = useCallback(
    async (input: HabitInput) => {
      const id = await db.insertHabit(sql, input, todayKey());
      await reload();
      await syncReminders({ ...input, id, createdAt: todayKey(), sort: 0 }).catch(() => {});
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

  const shieldsUsedThisMonth = useCallback(() => {
    const month = todayKey().slice(0, 7);
    return shieldList.filter((s) => s.usedOn.startsWith(month)).length;
  }, [shieldList]);

  const applyShield = useCallback(
    async (habitId: number, day: DayKey) => {
      const s: Shield = { habitId, day, usedOn: todayKey() };
      await db.addShield(sql, s);
      setShieldList((prev) => [...prev, s]);
    },
    [sql],
  );

  const restore = useCallback(
    async (newHabits: Habit[], checkins: Checkin[], newShields: Shield[]) => {
      await db.replaceAll(sql, newHabits, checkins, newShields);
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
    () => ({
      ready, today, habits, done, shields, shieldList, settings,
      onboarded: settings.onboarded === '1',
      nudgeEnabled, nudgeTime, celebration, dismissCelebration,
      allCheckins, toggle, create, update, remove, applyShield, shieldsUsedThisMonth, setSetting, restore,
    }),
    [ready, today, habits, done, shields, shieldList, settings, nudgeEnabled, nudgeTime, celebration, dismissCelebration,
      allCheckins, toggle, create, update, remove, applyShield, shieldsUsedThisMonth, setSetting, restore],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useHabits(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useHabits must be used inside HabitsProvider');
  return s;
}
