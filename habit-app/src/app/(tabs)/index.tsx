import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitCard } from '../../components/HabitCard';
import { ALL_DAYS, fromKey, isScheduled, type DayKey } from '../../lib/dates';
import type { HabitInput } from '../../lib/db';
import { useHabits } from '../../lib/store';
import { HABIT_COLORS, usePalette } from '../../lib/theme';

const STARTERS: HabitInput[] = [
  { name: 'Drink water', emoji: '💧', color: HABIT_COLORS[3], days: ALL_DAYS, reminder: null },
  { name: 'Read 10 pages', emoji: '📚', color: HABIT_COLORS[4], days: ALL_DAYS, reminder: null },
  { name: 'Walk 20 minutes', emoji: '🚶', color: HABIT_COLORS[2], days: ALL_DAYS, reminder: null },
  { name: 'Meditate', emoji: '🧘', color: HABIT_COLORS[5], days: ALL_DAYS, reminder: null },
];

export default function TodayScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { ready, habits, done, today, toggle, create } = useHabits();

  const { due, notDue } = useMemo(() => {
    const due = habits.filter((h) => isScheduled(h.days, today));
    const notDue = habits.filter((h) => !isScheduled(h.days, today));
    return { due, notDue };
  }, [habits, today]);

  const doneCount = due.filter((h) => done.get(h.id)?.has(today)).length;
  const progress = due.length ? doneCount / due.length : 0;

  const onToggle = (habitId: number, day: DayKey) =>
    toggle(habitId, day).catch(() => Alert.alert("Couldn't save", 'Please try again.'));

  const dateLabel = fromKey(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.date, { color: p.muted }]}>{dateLabel}</Text>
          <Text style={[styles.title, { color: p.text }]}>Today</Text>
        </View>
        <Pressable
          onPress={() => router.push('/habit/new')}
          style={[styles.add, { backgroundColor: p.accent }]}
          accessibilityRole="button"
          accessibilityLabel="New habit"
          hitSlop={6}
        >
          <SymbolView name="plus" size={20} weight="bold" tintColor="#fff" fallback={<Text style={styles.addText}>+</Text>} />
        </Pressable>
      </View>

      {!ready ? (
        <ActivityIndicator style={{ marginTop: 48 }} />
      ) : habits.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: p.card }]}>
          <Text style={{ fontSize: 44 }}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: p.text }]}>Start with one small habit</Text>
          <Text style={[styles.emptyBody, { color: p.muted }]}>
            Unlimited habits, free. Everything stays on your iPhone.
          </Text>
          <View style={styles.starters}>
            {STARTERS.map((s) => (
              <Pressable
                key={s.name}
                onPress={() => create(s)}
                style={[styles.starter, { backgroundColor: p.faint }]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${s.name}`}
              >
                <Text style={{ color: p.text, fontSize: 15 }}>
                  {s.emoji} {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push('/habit/new')} accessibilityRole="button">
            <Text style={{ color: p.accent, fontSize: 16, fontWeight: '600', marginTop: 4 }}>Create your own</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {due.length > 0 && (
            <View style={styles.progressWrap}>
              <View style={[styles.track, { backgroundColor: p.faint }]}>
                <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: p.accent }]} />
              </View>
              <Text style={[styles.progressText, { color: p.muted }]}>
                {doneCount === due.length ? 'All done for today 🎉' : `${doneCount} of ${due.length} done`}
              </Text>
            </View>
          )}

          <View style={styles.list}>
            {due.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                done={done.get(h.id) ?? EMPTY}
                today={today}
                onToggle={(day) => onToggle(h.id, day)}
              />
            ))}
          </View>

          {notDue.length > 0 && (
            <>
              <Text style={[styles.section, { color: p.muted }]}>NOT SCHEDULED TODAY</Text>
              <View style={[styles.list, { opacity: 0.7 }]}>
                {notDue.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    done={done.get(h.id) ?? EMPTY}
                    today={today}
                    onToggle={(day) => onToggle(h.id, day)}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const EMPTY = new Set<DayKey>();

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-end' },
  date: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  add: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addText: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: -2 },
  progressWrap: { gap: 6 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '500' },
  list: { gap: 12 },
  section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, marginLeft: 4 },
  empty: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, marginTop: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 },
  starter: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
});
