import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Heatmap } from '../../components/Heatmap';
import { HabitBadge, Sym } from '../../components/ui';
import { addDays, bestStreak, completionRate, currentStreak, describeDays, type DayKey } from '../../lib/dates';
import { FREE_HISTORY_WEEKS } from '../../lib/config';
import { usePro } from '../../lib/purchases';
import { formatTime } from '../../lib/i18n';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const EMPTY: ReadonlySet<DayKey> = new Set();

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePalette();
  const t = useStrings();
  const { isPro } = usePro();
  const { habits, done, shields, today, toggle } = useHabits();
  const habit = habits.find((h) => h.id === Number(id));
  if (!habit) return null;

  const days = done.get(habit.id) ?? EMPTY;
  const shielded = shields.get(habit.id);
  // Measure from when tracking started (creation or the earliest back-filled day), at most 30 days back.
  let started = habit.createdAt;
  for (const d of days) if (d < started) started = d;
  const windowStart = addDays(today, -29);
  const rateFrom = started > windowStart ? started : windowStart;
  // Today only counts once it's done, so the rate doesn't dip every morning.
  const rateTo = days.has(today) ? today : addDays(today, -1);

  const unlock = (from: 'insights' | 'history') => router.push({ pathname: '/paywall', params: { from } });

  const stats: { label: string; value: string; unit?: string; pro?: boolean; color?: string }[] = [
    { label: t.currentStreak, value: String(currentStreak(days, habit.days, today, shielded)), unit: t.days(2), color: habit.color },
    { label: t.checkins, value: String(days.size) },
    { label: t.bestStreak, value: String(bestStreak(days, habit.days, today, shielded)), unit: t.days(2), pro: true },
    { label: t.last30, value: `${Math.round(completionRate(days, habit.days, rateFrom, rateTo) * 100)}`, unit: '%', pro: true },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push(`/habit/edit/${habit.id}`)} hitSlop={8} accessibilityRole="button">
              <Text style={[FONT.body, { color: p.accent }]}>{t.edit}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <HabitBadge icon={habit.icon} color={habit.color} size={68} />
          <Text style={[FONT.title1, { color: p.text, textAlign: 'center' }]}>{habit.name}</Text>
          <Text style={[FONT.subhead, { color: p.muted }]}>
            {describeDays(habit.days, t)}
            {habit.reminder ? ` · ${formatTime(habit.reminder, t)}` : ''}
          </Text>
        </View>

        <View style={styles.stats}>
          {stats.map((s) => {
            const locked = s.pro && !isPro;
            return (
              <Pressable
                key={s.label}
                disabled={!locked}
                onPress={() => unlock('insights')}
                style={[styles.stat, { backgroundColor: p.card }, p.shadow]}
                accessibilityRole={locked ? 'button' : undefined}
                accessibilityLabel={locked ? `${s.label}. ${t.unlockWithPro}` : `${s.label}: ${s.value} ${s.unit ?? ''}`}
              >
                {locked ? (
                  <View style={styles.statValue}>
                    <Sym name="lock.fill" size={18} color={p.accent} />
                    <Text style={[FONT.headline, { color: p.accent }]}>{t.pro}</Text>
                  </View>
                ) : (
                  <View style={styles.statValue}>
                    <Text style={[styles.big, { color: s.color ?? p.text }]}>{s.value}</Text>
                    {!!s.unit && <Text style={[FONT.subhead, { color: p.muted }]}>{s.unit}</Text>}
                  </View>
                )}
                <Text style={[FONT.footnote, { color: p.muted }]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: p.card }, p.shadow]}>
          <View style={styles.cardHead}>
            <Text style={[FONT.headline, { color: p.text }]}>{t.history}</Text>
            <Text style={[FONT.footnote, { color: p.muted }]}>{t.lastWeeks(isPro ? 17 : FREE_HISTORY_WEEKS)}</Text>
          </View>
          <Heatmap
            done={days}
            shields={shielded}
            days={habit.days}
            color={habit.color}
            today={today}
            freeWeeks={isPro ? null : FREE_HISTORY_WEEKS}
            onToggle={(day) => toggle(habit.id, day).catch(() => Alert.alert(t.couldntSave, t.tryAgain))}
            onLocked={() => unlock('history')}
          />
          <Text style={[FONT.footnote, { color: p.muted }]}>{t.historyHint}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 6, paddingBottom: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 18, padding: 16, gap: 2, minHeight: 84 },
  statValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minHeight: 36 },
  big: { fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: 18, padding: 16, gap: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
