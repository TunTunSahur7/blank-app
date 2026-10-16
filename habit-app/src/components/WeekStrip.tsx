import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fromKey, weekdayOf, type DayKey } from '../lib/dates';
import { formatLongDate } from '../lib/i18n';
import { useStrings } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';
import { Ring } from './ui';

type Props = {
  days: DayKey[];
  selected: DayKey;
  today: DayKey;
  progress: (day: DayKey) => { done: number; total: number };
  onSelect: (day: DayKey) => void;
};

/** The last seven days, each with its own ring. Tap one to see or fill in that day. */
export function WeekStrip({ days, selected, today, progress, onSelect }: Props) {
  const p = usePalette();
  const s = useStrings();
  return (
    <View style={[styles.strip, { backgroundColor: p.card }, p.shadow]}>
      {days.map((day) => {
        const { done, total } = progress(day);
        const on = day === selected;
        const full = total > 0 && done === total;
        const date = fromKey(day).getDate();
        return (
          <Pressable
            key={day}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync();
              onSelect(day);
            }}
            style={styles.day}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={s.dayProgress(formatLongDate(fromKey(day), s), done, total)}
          >
            <Text style={[styles.letter, { color: on ? p.accent : p.muted }]}>{s.weekdayLetters[weekdayOf(day)]}</Text>
            <View style={styles.ringWrap}>
              {on && <View style={[styles.selected, { backgroundColor: p.accent }]} />}
              <Ring
                progress={total ? done / total : 0}
                size={38}
                stroke={3.5}
                color={on ? '#FFFFFF' : p.accent}
                track={on ? 'rgba(255,255,255,0.35)' : full ? p.accent : `${p.accent}22`}
              />
              <View style={styles.center}>
                <Text
                  style={[
                    FONT.subhead,
                    styles.num,
                    { color: on ? '#FFFFFF' : day === today ? p.accent : p.text, fontWeight: on || day === today ? '700' : '500' },
                  ]}
                >
                  {date}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 10 },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  letter: { fontSize: 12, fontWeight: '600' },
  ringWrap: { width: 38, height: 38 },
  selected: { position: 'absolute', top: 0, left: 0, width: 38, height: 38, borderRadius: 19 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  num: { fontVariant: ['tabular-nums'] },
});
