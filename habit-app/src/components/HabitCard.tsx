import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FREE_HISTORY_WEEKS } from '../lib/config';
import { addDays, currentStreak, describeDays, isScheduled, recentRate, weekdayOf, type DayKey } from '../lib/dates';
import type { Habit } from '../lib/db';
import { useStrings } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';
import { HoldCheck } from './HoldCheck';
import { HabitBadge, Sym } from './ui';

type Props = {
  habit: Habit;
  done: ReadonlySet<DayKey>;
  shields: ReadonlySet<DayKey> | undefined;
  /** The day being checked off (today, or a past day picked in the week strip). */
  day: DayKey;
  today: DayKey;
  isPro: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  onTap: () => void;
};

const CELL = 11;
const GAP = 3;

/**
 * A habit as a card: its promise, a hold-to-complete check, and a wall of every recent day,
 * HabitKit-style, so the streak you'd break is right in front of you.
 */
function HabitCardBase({ habit, done, shields, day, today, isPro, dimmed, onToggle, onTap }: Props) {
  const p = usePalette();
  const s = useStrings();
  const [width, setWidth] = useState(0);
  const checked = done.has(day);
  const streak = currentStreak(done, habit.days, day, shields);
  const rate = Math.round(recentRate(done, habit.days, habit.createdAt, today) * 100);

  const weeks = width ? Math.max(1, Math.floor((width + GAP) / (CELL + GAP))) : 0;
  const cell = weeks ? (width - GAP * (weeks - 1)) / weeks : 0;
  const lastSunday = addDays(today, -weekdayOf(today));
  const firstSunday = addDays(lastSunday, -(weeks - 1) * 7);
  const lockedCols = isPro ? 0 : Math.max(0, weeks - FREE_HISTORY_WEEKS);
  const empty = p.scheme === 'dark' ? '#2C2C2E' : '#EDEDF0';

  return (
    <Pressable
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: p.card, opacity: dimmed ? 0.55 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        p.shadow,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}. ${streak >= 2 ? s.streak(streak) : describeDays(habit.days, s)}. ${s.opensDetails}`}
    >
      <View style={styles.head}>
        <HabitBadge icon={habit.icon} color={habit.color} size={42} />
        <View style={styles.title}>
          <Text style={[FONT.headline, { color: p.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[FONT.footnote, { color: habit.promise ? habit.color : p.muted, fontWeight: habit.promise ? '500' : '400' }]} numberOfLines={1}>
            {habit.promise ? `“${habit.promise}”` : describeDays(habit.days, s)}
          </Text>
        </View>
        <HoldCheck
          done={checked}
          color={habit.color}
          size={46}
          label={checked ? s.undoLabel(habit.name) : s.holdLabel(habit.name)}
          onComplete={onToggle}
          onTap={onTap}
        />
      </View>

      <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {Array.from({ length: weeks }, (_, w) => {
          const start = addDays(firstSunday, w * 7);
          const locked = w < lockedCols;
          return (
            <View key={start} style={{ gap: GAP }}>
              {Array.from({ length: 7 }, (_, d) => {
                const key = addDays(start, d);
                const future = key > today;
                const kept = !locked && done.has(key);
                const shielded = !locked && !kept && !!shields?.has(key);
                const scheduled = isScheduled(habit.days, key);
                return (
                  <View
                    key={key}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: cell * 0.3,
                      backgroundColor: kept ? habit.color : shielded ? `${habit.color}66` : future ? 'transparent' : empty,
                      opacity: locked ? 0.45 : !kept && !scheduled ? 0.5 : 1,
                      borderWidth: key === day ? 1.5 : 0,
                      borderColor: kept ? p.text : habit.color,
                    }}
                  />
                );
              })}
            </View>
          );
        })}
        {lockedCols > 1 && (
          <View pointerEvents="none" style={[styles.lock, { width: lockedCols * (cell + GAP) - GAP }]}>
            <Sym name="lock.fill" size={13} color={p.muted} />
          </View>
        )}
      </View>

      <View style={styles.foot}>
        <View style={styles.footItem}>
          <Sym name="flame.fill" size={13} color={streak >= 2 ? '#FF9500' : p.faint} />
          <Text style={[FONT.footnote, { color: streak >= 2 ? p.text : p.muted, fontWeight: '600' }]}>{s.streak(streak)}</Text>
        </View>
        <Text style={[FONT.footnote, { color: p.muted }]}>{s.rate30(rate)}</Text>
      </View>
    </Pressable>
  );
}

export const HabitCard = memo(HabitCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', gap: GAP },
  lock: { position: 'absolute', left: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
