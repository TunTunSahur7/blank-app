import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, fromKey, isScheduled, weekdayOf, type DayKey } from '../lib/dates';
import { useStrings } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';
import { Sym } from './ui';

type Props = {
  done: ReadonlySet<DayKey>;
  shields: ReadonlySet<DayKey> | undefined;
  days: number;
  color: string;
  today: DayKey;
  /** Weeks a free member can see; older weeks show locked. */
  freeWeeks: number | null;
  onToggle: (day: DayKey) => void;
  onLocked: () => void;
};

const WEEKS = 17;
const GAP = 4;

/** Contribution-style grid: one column per week, Sunday on top. Tap a past day to fix it. */
export function Heatmap({ done, shields, days, color, today, freeWeeks, onToggle, onLocked }: Props) {
  const p = usePalette();
  const s = useStrings();
  const [width, setWidth] = useState(0);
  // Cells fill the card's width, so the grid fits every iPhone from SE to Pro Max.
  const cell = width ? Math.min(20, Math.floor((width - GAP * (WEEKS - 1)) / WEEKS)) : 0;
  const lastSunday = addDays(today, -weekdayOf(today));
  const firstSunday = addDays(lastSunday, -(WEEKS - 1) * 7);
  const lockedCols = freeWeeks === null ? 0 : WEEKS - freeWeeks;
  const weeks = Array.from({ length: WEEKS }, (_, w) => addDays(firstSunday, w * 7));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {cell > 0 && (
        <>
          <View style={[styles.months, { width: WEEKS * cell + (WEEKS - 1) * GAP }]}>
            {weeks.map((start, w) => {
              const d = fromKey(start);
              if (d.getDate() > 7 || w > WEEKS - 2) return null;
              return (
                <Text key={start} style={[styles.month, { left: w * (cell + GAP), color: p.muted }]}>
                  {s.monthsShort[d.getMonth()]}
                </Text>
              );
            })}
          </View>
          <View style={styles.grid}>
            {weeks.map((start, w) => {
              const locked = w < lockedCols;
              return (
                <View key={start} style={{ gap: GAP }}>
                  {Array.from({ length: 7 }, (_, d) => {
                    const day = addDays(start, d);
                    const future = day > today;
                    const kept = done.has(day);
                    const shielded = !kept && !!shields?.has(day);
                    const scheduled = isScheduled(days, day);
                    const bg = locked
                      ? p.faint
                      : kept
                        ? color
                        : shielded
                          ? `${color}66`
                          : scheduled && !future
                            ? p.faint
                            : 'transparent';
                    return (
                      <Pressable
                        key={day}
                        disabled={future || locked}
                        onPress={() => {
                          Haptics.selectionAsync();
                          onToggle(day);
                        }}
                        hitSlop={2}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: kept, disabled: future || locked }}
                        accessibilityLabel={fromKey(day).toDateString()}
                        style={{
                          width: cell,
                          height: cell,
                          borderRadius: Math.round(cell * 0.28),
                          backgroundColor: bg,
                          opacity: locked ? 0.55 : future ? 0.4 : 1,
                          borderWidth: day === today ? 1.5 : !locked && !kept && !shielded && (!scheduled || future) ? 1 : 0,
                          borderColor: day === today ? p.text : p.faint,
                        }}
                      />
                    );
                  })}
                </View>
              );
            })}
          </View>
          {lockedCols > 0 && (
            <Pressable
              onPress={onLocked}
              accessibilityRole="button"
              accessibilityLabel={`${s.fullHistory}. ${s.unlockWithPro}`}
              style={[styles.lock, { width: lockedCols * (cell + GAP) - GAP }]}
            >
              <View style={[styles.lockPill, { backgroundColor: p.card }, p.shadow]}>
                <Sym name="lock.fill" size={12} color={p.accent} />
                <Text style={[FONT.footnote, { color: p.text, fontWeight: '600' }]}>{s.fullHistory}</Text>
              </View>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  months: { height: 16 },
  month: { position: 'absolute', top: 0, fontSize: 11, fontWeight: '500' },
  grid: { flexDirection: 'row', gap: GAP },
  lock: { position: 'absolute', left: 0, top: 16, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
});
