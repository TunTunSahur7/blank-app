import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Heatmap } from '../../components/Heatmap';
import { addDays, bestStreak, completionRate, currentStreak, describeDays, type DayKey } from '../../lib/dates';
import { useHabits } from '../../lib/store';
import { tint, usePalette } from '../../lib/theme';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePalette();
  const { habits, done, today, toggle } = useHabits();
  const habit = habits.find((h) => h.id === Number(id));
  if (!habit) return null;

  const days = done.get(habit.id) ?? new Set<DayKey>();
  // Measure from when tracking started (creation or the earliest back-filled day), at most 30 days back.
  let started = habit.createdAt;
  for (const d of days) if (d < started) started = d;
  const windowStart = addDays(today, -29);
  const rateFrom = started > windowStart ? started : windowStart;
  // Today only counts once it's done, so the rate doesn't dip every morning.
  const rateTo = days.has(today) ? today : addDays(today, -1);
  const stats = [
    { label: 'Current streak', value: String(currentStreak(days, habit.days, today)) },
    { label: 'Best streak', value: String(bestStreak(days, habit.days, today)) },
    { label: 'Last 30 days', value: `${Math.round(completionRate(days, habit.days, rateFrom, rateTo) * 100)}%` },
    { label: 'Total check-ins', value: String(days.size) },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push(`/habit/edit/${habit.id}`)} hitSlop={8} accessibilityRole="button">
              <Text style={{ color: p.accent, fontSize: 17 }}>Edit</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.emoji, { backgroundColor: tint(habit.color, 0.18) }]}>
            <Text style={{ fontSize: 36 }}>{habit.emoji}</Text>
          </View>
          <Text style={[styles.name, { color: p.text }]}>{habit.name}</Text>
          <Text style={{ color: p.muted, fontSize: 15 }}>
            {describeDays(habit.days)}
            {habit.reminder ? ` · reminder ${habit.reminder}` : ''}
          </Text>
        </View>

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: p.card }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: p.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: p.card }]}>
          <Text style={[styles.cardTitle, { color: p.text }]}>History</Text>
          <Heatmap
            done={days}
            days={habit.days}
            color={habit.color}
            today={today}
            onToggle={(day) => toggle(habit.id, day).catch(() => Alert.alert("Couldn't save", 'Please try again.'))}
          />
          <Text style={{ color: p.muted, fontSize: 13 }}>Missed a check-in? Tap any past day to fix it.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 6 },
  emoji: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 16, padding: 14, gap: 2 },
  statValue: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '500' },
  card: { borderRadius: 18, padding: 14, gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
});
