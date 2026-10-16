import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Celebration } from '../../components/Celebration';
import { HabitRow } from '../../components/HabitRow';
import { LogoMark, PrimaryButton, Ring, Section, Sym } from '../../components/ui';
import { currentStreak, fromKey, isScheduled, rescuable, type DayKey } from '../../lib/dates';
import type { Habit } from '../../lib/db';
import { SHIELDS_PER_MONTH, usePro } from '../../lib/purchases';
import { useHabits } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const EMPTY: ReadonlySet<DayKey> = new Set();

export default function TodayScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { isPro } = usePro();
  const {
    ready, onboarded, habits, done, shields, today, toggle, celebration, dismissCelebration,
    applyShield, shieldsUsedThisMonth, settings, setSetting,
  } = useHabits();

  const { due, notDue } = useMemo(
    () => ({
      due: habits.filter((h) => isScheduled(h.days, today)),
      notDue: habits.filter((h) => !isScheduled(h.days, today)),
    }),
    [habits, today],
  );

  // Streaks that broke yesterday and can still be saved.
  const rescues = useMemo(
    () =>
      habits
        .map((h) => ({ habit: h, r: rescuable(done.get(h.id) ?? EMPTY, h.days, today, shields.get(h.id)) }))
        .filter((x): x is { habit: Habit; r: { day: DayKey; streak: number } } => x.r !== null)
        .filter((x) => settings[`rescue_dismissed:${x.habit.id}:${x.r.day}`] !== '1'),
    [habits, done, shields, today, settings],
  );

  if (!ready) return <ActivityIndicator style={{ flex: 1, backgroundColor: p.bg }} />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  const doneCount = due.filter((h) => done.get(h.id)?.has(today)).length;
  const open = due.filter((h) => !done.get(h.id)?.has(today));
  const atStake = Math.max(0, ...open.map((h) => currentStreak(done.get(h.id) ?? EMPTY, h.days, today, shields.get(h.id))));
  const progress = due.length ? doneCount / due.length : 0;
  const summary =
    due.length === 0
      ? 'A rest day. Nothing scheduled.'
      : open.length === 0
        ? 'Day closed. See you tomorrow.'
        : atStake >= 2
          ? `${open.length} left. Keep your ${atStake}-day streak alive.`
          : `${open.length} left. You’ve got this.`;

  const onToggle = (habitId: number) => {
    const wasLast = open.length === 1 && open[0].id === habitId;
    toggle(habitId, today)
      .then(() => {
        if (wasLast) setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 250);
      })
      .catch(() => Alert.alert("Couldn't save", 'Please try again.'));
  };

  const rescue = async (habit: Habit, day: DayKey, streak: number) => {
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { from: 'shield', habit: String(habit.id) } });
      return;
    }
    if (shieldsUsedThisMonth() >= SHIELDS_PER_MONTH) {
      Alert.alert('No shields left this month', `You get ${SHIELDS_PER_MONTH} Streak Shields each month. New ones arrive on the 1st.`);
      return;
    }
    await applyShield(habit.id, day);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Streak saved', `Your ${streak}-day ${habit.name} streak is safe.`);
  };

  const dateLabel = fromKey(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[FONT.footnote, styles.eyebrow, { color: p.muted }]}>{dateLabel}</Text>
            <Text style={[FONT.largeTitle, { color: p.text }]}>Today</Text>
          </View>
          <Pressable
            onPress={() => router.push('/habit/new')}
            style={({ pressed }) => [styles.add, { backgroundColor: `${p.accent}1F`, opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="New habit"
            hitSlop={6}
          >
            <Sym name="plus" size={17} color={p.accent} weight="bold" />
          </Pressable>
        </View>

        {habits.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: p.card }]}>
            <LogoMark size={72} />
            <Text style={[FONT.title3, { color: p.text, textAlign: 'center' }]}>Start with one small habit</Text>
            <Text style={[FONT.subhead, { color: p.muted, textAlign: 'center' }]}>Unlimited habits, free. Everything stays on your iPhone.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
              <PrimaryButton title="Browse the Habit Library" onPress={() => router.push('/habit/library')} />
            </View>
            <Pressable onPress={() => router.push('/habit/new')} hitSlop={8} accessibilityRole="button">
              <Text style={[FONT.headline, { color: p.accent }]}>Create Your Own</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {rescues.map(({ habit, r }) => (
              <View key={habit.id} style={[styles.rescue, { backgroundColor: p.card }, p.shadow]}>
                <View style={[styles.rescueIcon, { backgroundColor: `${habit.color}22` }]}>
                  <Sym name="shield.fill" size={22} color={habit.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[FONT.headline, { color: p.text }]}>Your {r.streak}-day streak broke</Text>
                  <Text style={[FONT.footnote, { color: p.muted }]}>
                    {habit.name} was missed yesterday. A Streak Shield can still save it.
                  </Text>
                  <View style={styles.rescueActions}>
                    <Pressable
                      onPress={() => rescue(habit, r.day, r.streak)}
                      style={[styles.rescueBtn, { backgroundColor: habit.color }]}
                      accessibilityRole="button"
                    >
                      <Text style={[FONT.subhead, { color: '#FFF', fontWeight: '600' }]}>Save Streak</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSetting(`rescue_dismissed:${habit.id}:${r.day}`, '1')}
                      style={styles.rescueSkip}
                      accessibilityRole="button"
                    >
                      <Text style={[FONT.subhead, { color: p.muted }]}>Let It Go</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <View style={[styles.summary, { backgroundColor: p.card }, p.shadow]}>
              <View>
                <Ring progress={progress} size={68} stroke={11} color={p.accent} track={`${p.accent}24`} />
                {due.length > 0 && open.length === 0 && (
                  <View style={styles.ringCheck}>
                    <Sym name="checkmark" size={24} color={p.accent} weight="heavy" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[FONT.title2, { color: p.text }]}>
                  {due.length === 0 ? 'Rest day' : open.length === 0 ? 'All done' : `${doneCount} of ${due.length} done`}
                </Text>
                <Text style={[FONT.subhead, { color: p.muted }]}>{summary}</Text>
              </View>
            </View>

            {due.length > 0 && (
              <Section title="Habits">
                {due.map((h, i) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    done={done.get(h.id) ?? EMPTY}
                    shields={shields.get(h.id)}
                    today={today}
                    last={i === due.length - 1}
                    onToggle={() => onToggle(h.id)}
                  />
                ))}
              </Section>
            )}

            {notDue.length > 0 && (
              <Section title="Not today">
                {notDue.map((h, i) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    done={done.get(h.id) ?? EMPTY}
                    shields={shields.get(h.id)}
                    today={today}
                    last={i === notDue.length - 1}
                    dimmed
                    onToggle={() => onToggle(h.id)}
                  />
                ))}
              </Section>
            )}
            <Pressable
              onPress={() => router.push('/habit/library')}
              style={({ pressed }) => [styles.more, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Sym name="sparkles" size={15} color={p.accent} />
              <Text style={[FONT.subhead, { color: p.accent, fontWeight: '600' }]}>Find more habits</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      <Celebration data={celebration} onClose={dismissCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4 },
  eyebrow: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.2 },
  add: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  summary: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringCheck: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, marginTop: 12 },
  rescue: { borderRadius: 18, padding: 16, flexDirection: 'row', gap: 14 },
  rescueIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rescueActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  rescueBtn: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center' },
  rescueSkip: { paddingHorizontal: 10, height: 36, justifyContent: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44 },
});
