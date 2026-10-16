import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitBadge, Section, Sym } from '../../components/ui';
import {
  addDays, bestStreak, completionRate, currentStreak, isScheduled, weekdayOf, type DayKey,
} from '../../lib/dates';
import { usePro } from '../../lib/purchases';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const EMPTY: ReadonlySet<DayKey> = new Set();

export default function ProgressScreen() {
  const p = usePalette();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { isPro } = usePro();
  const { habits, done, shields, today } = useHabits();

  const stats = useMemo(() => {
    // A habit counts from when tracking started: its creation or the earliest back-filled day.
    const started = new Map<number, DayKey>();
    for (const h of habits) {
      let first = h.createdAt;
      for (const d of done.get(h.id) ?? EMPTY) if (d < first) first = d;
      started.set(h.id, first);
    }
    const active = (day: DayKey) => habits.filter((h) => isScheduled(h.days, day) && (started.get(h.id) ?? today) <= day);

    const sunday = addDays(today, -weekdayOf(today));
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(sunday, i);
      const due = active(day);
      const hit = due.filter((h) => done.get(h.id)?.has(day)).length;
      return { day, letter: t.weekdayLetters[i], due: due.length, hit, future: day > today };
    });
    const weekDue = week.filter((d) => !d.future).reduce((a, d) => a + d.due, 0);
    const weekHit = week.reduce((a, d) => a + d.hit, 0);

    let total = 0;
    for (const s of done.values()) total += s.size;

    let perfect = 0;
    for (let i = 0; i < 30; i++) {
      const day = addDays(today, -i);
      const due = active(day);
      if (due.length && due.every((h) => done.get(h.id)?.has(day))) perfect++;
    }

    const streaks = habits.map((h) => ({
      habit: h,
      current: currentStreak(done.get(h.id) ?? EMPTY, h.days, today, shields.get(h.id)),
      best: bestStreak(done.get(h.id) ?? EMPTY, h.days, today, shields.get(h.id)),
      rate: completionRate(done.get(h.id) ?? EMPTY, h.days, addDays(today, -29), addDays(today, -1)),
    }));

    // Strongest weekday over the last 8 weeks.
    const byWeekday = Array.from({ length: 7 }, () => ({ due: 0, hit: 0 }));
    for (let i = 1; i <= 56; i++) {
      const day = addDays(today, -i);
      for (const h of active(day)) {
        byWeekday[weekdayOf(day)].due++;
        if (done.get(h.id)?.has(day)) byWeekday[weekdayOf(day)].hit++;
      }
    }
    const rated = byWeekday.map((w, i) => ({ i, r: w.due >= 3 ? w.hit / w.due : -1 })).filter((w) => w.r >= 0);
    const strongest = rated.length ? rated.reduce((a, b) => (b.r > a.r ? b : a)) : null;

    return {
      week, weekDue, weekHit, total, perfect, streaks,
      topCurrent: Math.max(0, ...streaks.map((s) => s.current)),
      topBest: Math.max(0, ...streaks.map((s) => s.best)),
      strongest,
    };
  }, [habits, done, shields, today, t]);

  const tiles = [
    { label: t.longestActive, value: String(stats.topCurrent), unit: t.days(2) },
    { label: t.perfectDays, value: String(stats.perfect), unit: '' },
    { label: t.totalCheckins, value: String(stats.total), unit: '' },
    { label: t.bestEver, value: String(stats.topBest), unit: t.days(2) },
  ];

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}>
      <Text style={[FONT.largeTitle, { color: p.text, paddingHorizontal: 4, marginTop: 18 }]}>{t.progressTitle}</Text>

      <View style={[styles.card, { backgroundColor: p.card }, p.shadow]}>
        <View style={styles.cardHead}>
          <Text style={[FONT.headline, { color: p.text }]}>{t.thisWeek}</Text>
          <Text style={[FONT.footnote, { color: p.muted }]}>
            {t.checkinsOf(stats.weekHit, stats.weekDue)}
          </Text>
        </View>
        <View style={styles.chart}>
          {stats.week.map((d) => {
            const ratio = d.due ? d.hit / d.due : 0;
            const isToday = d.day === today;
            return (
              <View key={d.day} style={styles.barCol} accessibilityLabel={`${t.weekdays[weekdayOf(d.day)]}: ${d.hit} / ${d.due}`}>
                <View style={[styles.barTrack, { backgroundColor: p.fill, opacity: d.future ? 0.5 : 1 }]}>
                  <View style={[styles.barFill, { height: `${Math.max(ratio * 100, ratio > 0 ? 8 : 0)}%`, backgroundColor: p.accent }]} />
                </View>
                <Text style={[FONT.caption, { color: isToday ? p.text : p.muted, fontWeight: isToday ? '700' : '500' }]}>{d.letter}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.tiles}>
        {tiles.map((t) => (
          <View key={t.label} style={[styles.tile, { backgroundColor: p.card }, p.shadow]}>
            <View style={styles.tileValue}>
              <Text style={[styles.big, { color: p.text }]}>{t.value}</Text>
              {!!t.unit && <Text style={[FONT.subhead, { color: p.muted }]}>{t.unit}</Text>}
            </View>
            <Text style={[FONT.footnote, { color: p.muted }]}>{t.label}</Text>
          </View>
        ))}
      </View>

      {isPro ? (
        <>
          {stats.strongest && (
            <View style={[styles.card, styles.insight, { backgroundColor: p.card }, p.shadow]}>
              <View style={[styles.insightIcon, { backgroundColor: '#34C759' }]}>
                <Sym name="star.fill" size={16} color="#FFF" />
              </View>
              <Text style={[FONT.subhead, { color: p.text, flex: 1 }]}>
                {t.strongestDay(t.weekdays[stats.strongest.i], Math.round(stats.strongest.r * 100))}
              </Text>
            </View>
          )}
          <Section title={t.last30}>
            {stats.streaks.map((s, i) => (
              <Pressable
                key={s.habit.id}
                onPress={() => router.push(`/habit/${s.habit.id}`)}
                style={[styles.rateRow, i < stats.streaks.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}
              >
                <HabitBadge icon={s.habit.icon} color={s.habit.color} size={30} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.cardHead}>
                    <Text style={[FONT.subhead, { color: p.text, fontWeight: '600' }]} numberOfLines={1}>{s.habit.name}</Text>
                    <Text style={[FONT.footnote, { color: p.muted }]}>{Math.round(s.rate * 100)}%</Text>
                  </View>
                  <View style={[styles.rateTrack, { backgroundColor: p.fill }]}>
                    <View style={[styles.rateFill, { width: `${s.rate * 100}%`, backgroundColor: s.habit.color }]} />
                  </View>
                </View>
              </Pressable>
            ))}
          </Section>
        </>
      ) : (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { from: 'insights' } })}
          style={[styles.card, { backgroundColor: p.card, gap: 14 }, p.shadow]}
          accessibilityRole="button"
          accessibilityLabel={`${t.unlockInsights}. ${t.unlockWithPro}`}
        >
          <View style={styles.cardHead}>
            <Text style={[FONT.headline, { color: p.text }]}>{t.insights}</Text>
            <View style={[styles.proPill, { backgroundColor: `${p.accent}1F` }]}>
              <Sym name="lock.fill" size={11} color={p.accent} />
              <Text style={[FONT.caption, { color: p.accent, fontWeight: '700' }]}>PRO</Text>
            </View>
          </View>
          {[0.82, 0.64, 0.45].map((w, i) => (
            <View key={i} style={styles.ghostRow}>
              <View style={[styles.ghostBadge, { backgroundColor: p.faint }]} />
              <View style={[styles.rateTrack, { flex: 1, backgroundColor: p.fill }]}>
                <View style={[styles.rateFill, { width: `${w * 100}%`, backgroundColor: p.faint }]} />
              </View>
            </View>
          ))}
          <Text style={[FONT.subhead, { color: p.muted }]}>
            {t.insightsTeaser}
          </Text>
          <Text style={[FONT.headline, { color: p.accent }]}>{t.unlockInsights}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 20 },
  card: { borderRadius: 18, padding: 18 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, height: 132 },
  barCol: { alignItems: 'center', gap: 8, flex: 1 },
  barTrack: { flex: 1, width: 18, borderRadius: 9, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 9 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexGrow: 1, flexBasis: '45%', borderRadius: 18, padding: 16, gap: 2 },
  tileValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  big: { fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  insightIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rateTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  rateFill: { height: 6, borderRadius: 3 },
  proPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ghostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ghostBadge: { width: 26, height: 26, borderRadius: 7 },
});
