import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Celebration } from '../../components/Celebration';
import { HabitCard } from '../../components/HabitCard';
import { HabitRow } from '../../components/HabitRow';
import { WeekStrip } from '../../components/WeekStrip';
import { LogoMark, PrimaryButton, Ring, Section, Sym } from '../../components/ui';
import { addDays, currentStreak, fromKey, isScheduled, rescuable, weekdayOf, type DayKey } from '../../lib/dates';
import type { Habit } from '../../lib/db';
import { SHIELDS_PER_MONTH, usePro } from '../../lib/purchases';
import { formatLongDate } from '../../lib/i18n';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const EMPTY: ReadonlySet<DayKey> = new Set();

export default function TodayScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { isPro } = usePro();
  const {
    ready, onboarded, habits, done, shields, today, toggle, celebration, dismissCelebration,
    applyShield, shieldsUsedThisMonth, settings, setSetting,
  } = useHabits();

  // The day being looked at: today, or one of the last six days picked in the week strip.
  const [picked, setPicked] = useState<DayKey | null>(null);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)), [today]);
  const day = picked && week.includes(picked) ? picked : today;
  const isToday = day === today;
  const layout = settings.today_layout === 'list' ? 'list' : 'cards';
  const [hintAgain, setHintAgain] = useState(false);
  const showHint = settings.hold_learned !== '1' || hintAgain;

  const { due, notDue } = useMemo(
    () => ({
      due: habits.filter((h) => isScheduled(h.days, day)),
      notDue: habits.filter((h) => !isScheduled(h.days, day)),
    }),
    [habits, day],
  );

  const dayProgress = useCallback(
    (d: DayKey) => {
      const scheduled = habits.filter((h) => isScheduled(h.days, d));
      return { done: scheduled.filter((h) => done.get(h.id)?.has(d)).length, total: scheduled.length };
    },
    [habits, done],
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

  const doneCount = due.filter((h) => done.get(h.id)?.has(day)).length;
  const open = due.filter((h) => !done.get(h.id)?.has(day));
  const atStake = Math.max(0, ...open.map((h) => currentStreak(done.get(h.id) ?? EMPTY, h.days, day, shields.get(h.id))));
  const progress = due.length ? doneCount / due.length : 0;
  const summary =
    due.length === 0
      ? s.summaryRest
      : !isToday
        ? s.pastDaySummary
        : open.length === 0
          ? s.summaryClosed
          : atStake >= 2
            ? s.summaryKeep(open.length, atStake)
            : s.summaryLeft(open.length);

  const onToggle = (habitId: number) => {
    const wasLast = open.length === 1 && open[0].id === habitId;
    if (settings.hold_learned !== '1') setSetting('hold_learned', '1');
    setHintAgain(false);
    toggle(habitId, day)
      .then(() => {
        if (wasLast) setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 250);
      })
      .catch(() => Alert.alert(s.couldntSave, s.tryAgain));
  };

  // A quick tap instead of a hold: remind them how it works.
  const onTap = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setHintAgain(true);
  };

  const switchLayout = () => {
    Haptics.selectionAsync();
    setSetting('today_layout', layout === 'cards' ? 'list' : 'cards');
  };

  const rescue = async (habit: Habit, day: DayKey, streak: number) => {
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { from: 'shield', habit: String(habit.id) } });
      return;
    }
    if (shieldsUsedThisMonth() >= SHIELDS_PER_MONTH) {
      Alert.alert(s.noShieldsTitle, s.noShieldsBody(SHIELDS_PER_MONTH));
      return;
    }
    await applyShield(habit.id, day);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(s.streakSavedTitle, s.streakSavedBody(streak, habit.name));
  };

  const dateLabel = formatLongDate(fromKey(day), s);
  const title = isToday ? s.today : day === addDays(today, -1) ? s.yesterday : s.weekdays[weekdayOf(day)];

  const renderHabit = (h: Habit, i: number, list: Habit[], dimmed?: boolean) =>
    layout === 'cards' ? (
      <HabitCard
        key={h.id}
        habit={h}
        done={done.get(h.id) ?? EMPTY}
        shields={shields.get(h.id)}
        day={day}
        today={today}
        isPro={isPro}
        dimmed={dimmed}
        onToggle={() => onToggle(h.id)}
        onTap={onTap}
      />
    ) : (
      <HabitRow
        key={h.id}
        habit={h}
        done={done.get(h.id) ?? EMPTY}
        shields={shields.get(h.id)}
        today={day}
        last={i === list.length - 1}
        dimmed={dimmed}
        onToggle={() => onToggle(h.id)}
        onTap={onTap}
      />
    );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[FONT.footnote, styles.eyebrow, { color: p.muted }]}>{dateLabel}</Text>
            <Text style={[FONT.largeTitle, { color: p.text }]}>{title}</Text>
          </View>
          {habits.length > 0 && (
            <Pressable
              onPress={switchLayout}
              style={({ pressed }) => [styles.add, { backgroundColor: p.fill, opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={layout === 'cards' ? s.showList : s.showCards}
              hitSlop={6}
            >
              <Sym name={layout === 'cards' ? 'list.bullet' : 'rectangle.grid.1x2'} size={15} color={p.text} weight="semibold" />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push('/habit/new')}
            style={({ pressed }) => [styles.add, { backgroundColor: `${p.accent}1F`, opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={s.newHabit}
            hitSlop={6}
          >
            <Sym name="plus" size={17} color={p.accent} weight="bold" />
          </Pressable>
        </View>

        {habits.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: p.card }]}>
            <LogoMark size={72} />
            <Text style={[FONT.title3, { color: p.text, textAlign: 'center' }]}>{s.emptyTitle}</Text>
            <Text style={[FONT.subhead, { color: p.muted, textAlign: 'center' }]}>{s.emptyBody}</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
              <PrimaryButton title={s.browseLibrary} onPress={() => router.push('/habit/library')} />
            </View>
            <Pressable onPress={() => router.push('/habit/new')} hitSlop={8} accessibilityRole="button">
              <Text style={[FONT.headline, { color: p.accent }]}>{s.createOwn}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WeekStrip days={week} selected={day} today={today} progress={dayProgress} onSelect={setPicked} />

            {!isToday && (
              <Pressable
                onPress={() => setPicked(null)}
                style={({ pressed }) => [styles.back, { backgroundColor: `${p.accent}1F`, opacity: pressed ? 0.6 : 1 }]}
                accessibilityRole="button"
              >
                <Sym name="arrow.uturn.backward" size={13} color={p.accent} weight="bold" />
                <Text style={[FONT.subhead, { color: p.accent, fontWeight: '600' }]}>{s.backToToday}</Text>
              </Pressable>
            )}

            {isToday && rescues.map(({ habit, r }) => (
              <View key={habit.id} style={[styles.rescue, { backgroundColor: p.card }, p.shadow]}>
                <View style={[styles.rescueIcon, { backgroundColor: `${habit.color}22` }]}>
                  <Sym name="shield.fill" size={22} color={habit.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[FONT.headline, { color: p.text }]}>{s.rescueTitle(r.streak)}</Text>
                  <Text style={[FONT.footnote, { color: p.muted }]}>
                    {s.rescueBody(habit.name)}
                  </Text>
                  <View style={styles.rescueActions}>
                    <Pressable
                      onPress={() => rescue(habit, r.day, r.streak)}
                      style={[styles.rescueBtn, { backgroundColor: habit.color }]}
                      accessibilityRole="button"
                    >
                      <Text style={[FONT.subhead, { color: '#FFF', fontWeight: '600' }]}>{s.rescueSave}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSetting(`rescue_dismissed:${habit.id}:${r.day}`, '1')}
                      style={styles.rescueSkip}
                      accessibilityRole="button"
                    >
                      <Text style={[FONT.subhead, { color: p.muted }]}>{s.rescueLetGo}</Text>
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
                  {due.length === 0 ? s.restDay : open.length === 0 ? s.allDone : s.doneOf(doneCount, due.length)}
                </Text>
                <Text style={[FONT.subhead, { color: p.muted }]}>{summary}</Text>
              </View>
            </View>

            {due.length > 0 && (
              <Section title={s.sectionHabits} bare={layout === 'cards'} footer={showHint && open.length > 0 ? s.holdHint : undefined}>
                {due.map((h, i) => renderHabit(h, i, due))}
              </Section>
            )}

            {notDue.length > 0 && (
              <Section title={isToday ? s.sectionNotToday : s.sectionNotScheduled} bare={layout === 'cards'}>
                {notDue.map((h, i) => renderHabit(h, i, notDue, true))}
              </Section>
            )}
            <Pressable
              onPress={() => router.push('/habit/library')}
              style={({ pressed }) => [styles.more, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Sym name="sparkles" size={15} color={p.accent} />
              <Text style={[FONT.subhead, { color: p.accent, fontWeight: '600' }]}>{s.findMore}</Text>
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
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 4 },
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
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 14, height: 34, borderRadius: 17, marginTop: -8 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44 },
});
