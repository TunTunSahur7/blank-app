import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, fromKey, isScheduled, weekdayOf, type DayKey } from '../lib/dates';
import { usePalette } from '../lib/theme';

type Props = {
  done: Set<DayKey>;
  days: number;
  color: string;
  today: DayKey;
  weeks?: number;
  onToggle: (day: DayKey) => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** GitHub-style grid: one column per week, Sunday on top. Tap a past day to fix it. */
export function Heatmap({ done, days, color, today, weeks = 15, onToggle }: Props) {
  const p = usePalette();
  const lastSunday = addDays(today, -weekdayOf(today));
  const firstSunday = addDays(lastSunday, -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(firstSunday, w * 7 + d)),
  );

  return (
    <View>
      <View style={styles.grid}>
        {columns.map((col, w) => {
          const first = fromKey(col[0]);
          const showMonth = w === 0 || first.getDate() <= 7;
          return (
            <View key={col[0]} style={styles.col}>
              <Text style={[styles.month, { color: p.muted }]}>{showMonth ? MONTHS[first.getMonth()] : ' '}</Text>
              {col.map((day) => {
                const future = day > today;
                const isDone = done.has(day);
                const scheduled = isScheduled(days, day);
                return (
                  <Pressable
                    key={day}
                    disabled={future}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onToggle(day);
                    }}
                    hitSlop={2}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone, disabled: future }}
                    accessibilityLabel={fromKey(day).toDateString()}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: isDone ? color : scheduled && !future ? p.faint : 'transparent',
                        borderColor: day === today ? p.text : p.faint,
                        borderWidth: day === today ? 1.5 : isDone || (scheduled && !future) ? 0 : 1,
                        opacity: future ? 0.35 : 1,
                      },
                    ]}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { gap: 4, alignItems: 'center' },
  month: { fontSize: 10, height: 14 },
  cell: { width: 17, height: 17, borderRadius: 5 },
});
