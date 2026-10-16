import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_DAYS, WEEKDAY_LETTERS, WEEKDAY_SHORT, describeDays } from '../lib/dates';
import type { HabitInput } from '../lib/db';
import { ICONS } from '../lib/icons';
import { ensurePermission } from '../lib/reminders';
import { FONT, HABIT_COLORS, usePalette } from '../lib/theme';
import { HabitBadge, Section } from './ui';

type Props = {
  title: string;
  initial?: HabitInput;
  submitLabel: string;
  onSubmit: (input: HabitInput) => Promise<void>;
  onDelete?: () => void;
};

const DEFAULT: HabitInput = { name: '', icon: 'water', color: HABIT_COLORS[0].hex, days: ALL_DAYS, reminder: null };

const pad = (n: number) => String(n).padStart(2, '0');

function toDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(hhmm: string): string {
  return toDate(hhmm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function HabitForm({ title, initial = DEFAULT, submitLabel, onSubmit, onDelete }: Props) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [color, setColor] = useState(initial.color);
  const [days, setDays] = useState(initial.days);
  const [reminder, setReminder] = useState<string | null>(initial.reminder);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && days !== 0 && !saving;

  const toggleDay = (i: number) => {
    Haptics.selectionAsync();
    setDays((d) => d ^ (1 << i));
  };

  const setReminderEnabled = async (on: boolean) => {
    if (!on) return setReminder(null);
    const ok = await ensurePermission();
    if (!ok) {
      Alert.alert('Notifications are off', 'Turn on notifications for Daymark in Settings to get reminders.');
      return;
    }
    setReminder('09:00');
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), icon, color, days, reminder });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't save", 'Something went wrong saving this habit. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[styles.header, { borderBottomColor: p.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn} accessibilityRole="button">
          <Text style={[FONT.body, { color: p.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={[FONT.headline, { color: p.text }]}>{title}</Text>
        <Pressable onPress={submit} disabled={!canSave} hitSlop={8} style={[styles.headerBtn, { alignItems: 'flex-end' }]} accessibilityRole="button">
          <Text style={[FONT.headline, { color: p.accent, opacity: canSave ? 1 : 0.35 }]}>{submitLabel}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          <HabitBadge icon={icon} color={color} size={72} />
        </View>

        <View style={[styles.field, { backgroundColor: p.card }, p.shadow]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={p.muted}
            autoFocus={!initial.name}
            maxLength={40}
            returnKeyType="done"
            clearButtonMode="while-editing"
            style={[FONT.body, styles.input, { color: p.text }]}
            accessibilityLabel="Habit name"
          />
        </View>

        <Section title="Icon">
          <View style={styles.iconGrid}>
            {ICONS.map((ic) => {
              const on = ic.key === icon;
              return (
                <Pressable
                  key={ic.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setIcon(ic.key);
                  }}
                  style={[styles.iconCell, { opacity: on ? 1 : 0.9 }]}
                  accessibilityRole="radio"
                  accessibilityLabel={ic.label}
                  accessibilityState={{ selected: on }}
                >
                  <View style={{ borderRadius: 14, padding: 2, borderWidth: 2, borderColor: on ? color : 'transparent' }}>
                    <HabitBadge icon={ic.key} color={on ? color : p.scheme === 'dark' ? '#3A3A3C' : '#C7C7CC'} size={38} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Color">
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => {
              const on = c.hex === color;
              return (
                <Pressable
                  key={c.hex}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setColor(c.hex);
                  }}
                  style={[styles.swatchRing, { borderColor: on ? c.hex : 'transparent' }]}
                  accessibilityRole="radio"
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Repeat" right={<Text style={[FONT.footnote, { color: p.muted }]}>{days ? describeDays(days) : 'Pick a day'}</Text>}>
          <View style={styles.dayRow}>
            {WEEKDAY_LETTERS.map((l, i) => {
              const on = (days & (1 << i)) !== 0;
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.dayChip, { backgroundColor: on ? color : p.fill }]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={WEEKDAY_SHORT[i]}
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[FONT.subhead, { color: on ? '#FFFFFF' : p.muted, fontWeight: '600' }]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Reminder" footer="Days off never break a streak. You'll only be reminded on the days you pick.">
          <View style={[styles.line, reminder ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator } : null]}>
            <Text style={[FONT.body, { color: p.text }]}>Remind me</Text>
            <Switch value={reminder !== null} onValueChange={setReminderEnabled} accessibilityLabel="Remind me" />
          </View>
          {reminder && (
            <View style={styles.line}>
              <Text style={[FONT.body, { color: p.text }]}>Time</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  mode="time"
                  display="compact"
                  value={toDate(reminder)}
                  minuteInterval={5}
                  onValueChange={(_, d) => setReminder(`${pad(d.getHours())}:${pad(d.getMinutes())}`)}
                />
              ) : (
                <View style={[styles.timePill, { backgroundColor: p.fill }]}>
                  <Text style={[FONT.body, { color: p.text }]}>{formatTime(reminder)}</Text>
                </View>
              )}
            </View>
          )}
        </Section>

        {onDelete && (
          <Section>
            <Pressable onPress={onDelete} style={styles.deleteRow} accessibilityRole="button">
              <Text style={[FONT.body, { color: p.danger }]}>Delete Habit</Text>
            </Pressable>
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { minWidth: 64, height: 44, justifyContent: 'center' },
  content: { padding: 16, gap: 22 },
  preview: { alignItems: 'center', paddingTop: 4 },
  field: { borderRadius: 16 },
  input: { paddingHorizontal: 16, height: 52 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, rowGap: 6 },
  iconCell: { width: '16.66%', alignItems: 'center' },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  swatchRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, padding: 3 },
  swatch: { flex: 1, borderRadius: 20 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  dayChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  line: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  timePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteRow: { height: 50, alignItems: 'center', justifyContent: 'center' },
});
