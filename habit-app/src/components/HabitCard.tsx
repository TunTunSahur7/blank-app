import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, currentStreak, describeDays, fromKey, isScheduled, WEEKDAY_LETTERS, type DayKey } from '../lib/dates';
import type { Habit } from '../lib/db';
import { tint, usePalette } from '../lib/theme';

type Props = {
  habit: Habit;
  done: Set<DayKey>;
  today: DayKey;
  onToggle: (day: DayKey) => void;
};

function HabitCardBase({ habit, done, today, onToggle }: Props) {
  const p = usePalette();
  const doneToday = done.has(today);
  const streak = currentStreak(done, habit.days, today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const toggle = (day: DayKey) => {
    const willBeDone = !done.has(day);
    Haptics.impactAsync(willBeDone ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    onToggle(day);
  };

  return (
    <Pressable
      onPress={() => router.push(`/habit/${habit.id}`)}
      style={({ pressed }) => [styles.card, { backgroundColor: p.card, opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}, ${streak} day streak. Opens details.`}
    >
      <View style={styles.top}>
        <View style={[styles.emoji, { backgroundColor: tint(habit.color, 0.16) }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: p.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.sub, { color: p.muted }]} numberOfLines={1}>
            {streak > 0 ? `🔥 ${streak}-day streak · ` : ''}
            {describeDays(habit.days)}
          </Text>
        </View>
        <Pressable
          onPress={() => toggle(today)}
          hitSlop={8}
          style={[
            styles.check,
            doneToday
              ? { backgroundColor: habit.color, borderColor: habit.color }
              : { borderColor: tint(habit.color, 0.5) },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: doneToday }}
          accessibilityLabel={`Mark ${habit.name} done today`}
        >
          {doneToday && (
            <SymbolView name="checkmark" size={20} weight="bold" tintColor="#fff" fallback={<Text style={styles.tick}>✓</Text>} />
          )}
        </Pressable>
      </View>

      <View style={styles.week}>
        {week.map((day) => {
          const isDone = done.has(day);
          const scheduled = isScheduled(habit.days, day);
          return (
            <Pressable
              key={day}
              onPress={() => toggle(day)}
              hitSlop={4}
              style={styles.dayCol}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={`${fromKey(day).toDateString()}`}
            >
              <Text style={[styles.dayLetter, { color: day === today ? p.text : p.muted }]}>
                {WEEKDAY_LETTERS[fromKey(day).getDay()]}
              </Text>
              <View
                style={[
                  styles.dot,
                  isDone
                    ? { backgroundColor: habit.color }
                    : { backgroundColor: scheduled ? p.faint : 'transparent', borderColor: p.faint, borderWidth: scheduled ? 0 : 1.5 },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

export const HabitCard = memo(HabitCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 14, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13 },
  check: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontSize: 20, fontWeight: '800' },
  week: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dayCol: { alignItems: 'center', gap: 6, minWidth: 32 },
  dayLetter: { fontSize: 11, fontWeight: '600' },
  dot: { width: 22, height: 22, borderRadius: 11 },
});
