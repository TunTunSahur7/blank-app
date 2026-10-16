import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, currentStreak, describeDays, isScheduled, type DayKey } from '../lib/dates';
import type { Habit } from '../lib/db';
import { useStrings } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';
import { HoldCheck } from './HoldCheck';
import { HabitBadge, Sym } from './ui';

type Props = {
  habit: Habit;
  done: ReadonlySet<DayKey>;
  shields: ReadonlySet<DayKey> | undefined;
  today: DayKey;
  last: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  onTap?: () => void;
};

function HabitRowBase({ habit, done, shields, today, last, dimmed, onToggle, onTap }: Props) {
  const p = usePalette();
  const s = useStrings();
  const doneToday = done.has(today);
  const streak = currentStreak(done, habit.days, today, shields);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const sub = streak >= 2 ? s.streak(streak) : doneToday ? s.doneToday : describeDays(habit.days, s);

  return (
    <Pressable
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fill : 'transparent', opacity: dimmed ? 0.55 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}. ${sub}. ${s.opensDetails}`}
    >
      <HabitBadge icon={habit.icon} color={habit.color} />
      <View style={[styles.body, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
        <View style={styles.text}>
          <Text style={[FONT.headline, { color: p.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.dots}>
              {week.map((day) => {
                const kept = done.has(day);
                const shielded = !kept && shields?.has(day);
                const scheduled = isScheduled(habit.days, day);
                return (
                  <View
                    key={day}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: kept ? habit.color : shielded ? `${habit.color}66` : scheduled ? p.faint : 'transparent',
                        borderWidth: !kept && !shielded && !scheduled ? 1 : 0,
                        borderColor: p.faint,
                      },
                    ]}
                  />
                );
              })}
            </View>
            {streak >= 2 && <Sym name="flame.fill" size={11} color="#FF9500" />}
            <Text style={[FONT.footnote, { color: p.muted }]} numberOfLines={1}>
              {sub}
            </Text>
          </View>
        </View>
        <HoldCheck
          done={doneToday}
          color={habit.color}
          size={34}
          label={doneToday ? s.undoLabel(habit.name) : s.holdLabel(habit.name)}
          onComplete={onToggle}
          onTap={onTap}
        />
      </View>
    </Pressable>
  );
}

export const HabitRow = memo(HabitRowBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 76, paddingRight: 16, gap: 10 },
  text: { flex: 1, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dots: { flexDirection: 'row', gap: 3, marginRight: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
