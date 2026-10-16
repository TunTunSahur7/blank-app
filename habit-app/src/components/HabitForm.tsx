import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ALL_DAYS, WEEKDAY_LETTERS } from '../lib/dates';
import type { HabitInput } from '../lib/db';
import { ensurePermission } from '../lib/reminders';
import { HABIT_COLORS, HABIT_EMOJI, tint, usePalette } from '../lib/theme';

type Props = {
  initial?: HabitInput;
  submitLabel: string;
  onSubmit: (input: HabitInput) => Promise<void>;
  onDelete?: () => void;
};

const DEFAULT: HabitInput = { name: '', emoji: '💧', color: HABIT_COLORS[4], days: ALL_DAYS, reminder: null };

const pad = (n: number) => String(n).padStart(2, '0');

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`;
}

export function HabitForm({ initial = DEFAULT, submitLabel, onSubmit, onDelete }: Props) {
  const p = usePalette();
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
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
      Alert.alert('Notifications are off', 'Turn on notifications for Daymark in the Settings app to get reminders.');
      return;
    }
    setReminder('09:00');
  };

  const shiftTime = (minutes: number) => {
    if (!reminder) return;
    const [h, m] = reminder.split(':').map(Number);
    const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
    setReminder(`${pad(Math.floor(total / 60))}:${pad(total % 60)}`);
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), emoji, color, days, reminder });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't save", 'Something went wrong saving this habit. Please try again.');
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.preview}>
        <View style={[styles.bigEmoji, { backgroundColor: tint(color, 0.18) }]}>
          <Text style={{ fontSize: 40 }}>{emoji}</Text>
        </View>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
        placeholderTextColor={p.muted}
        autoFocus={!initial.name}
        maxLength={60}
        returnKeyType="done"
        style={[styles.input, { backgroundColor: p.card, color: p.text }]}
        accessibilityLabel="Habit name"
      />

      <Section title="Icon" color={p.muted}>
        <View style={[styles.box, styles.wrap, { backgroundColor: p.card }]}>
          {HABIT_EMOJI.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emojiCell, e === emoji && { backgroundColor: tint(color, 0.22) }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: e === emoji }}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Color" color={p.muted}>
        <View style={[styles.box, styles.row, { backgroundColor: p.card }]}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.swatch, { backgroundColor: c, borderColor: c === color ? p.text : 'transparent' }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: c === color }}
              accessibilityLabel={`Color ${c}`}
            />
          ))}
        </View>
      </Section>

      <Section title="Repeat on" color={p.muted}>
        <View style={[styles.box, styles.row, { backgroundColor: p.card }]}>
          {WEEKDAY_LETTERS.map((l, i) => {
            const on = (days & (1 << i)) !== 0;
            return (
              <Pressable
                key={i}
                onPress={() => toggleDay(i)}
                style={[styles.dayChip, { backgroundColor: on ? color : p.faint }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <Text style={{ color: on ? '#fff' : p.muted, fontWeight: '700' }}>{l}</Text>
              </Pressable>
            );
          })}
        </View>
        {days === 0 && <Text style={[styles.hint, { color: p.danger }]}>Pick at least one day.</Text>}
      </Section>

      <Section title="Reminder" color={p.muted}>
        <View style={[styles.box, { backgroundColor: p.card, gap: 12 }]}>
          <View style={styles.between}>
            <Text style={{ color: p.text, fontSize: 16 }}>Remind me</Text>
            <Switch value={reminder !== null} onValueChange={setReminderEnabled} trackColor={{ true: color }} />
          </View>
          {reminder && (
            <View style={styles.between}>
              <Stepper label="−" onPress={() => shiftTime(-15)} color={p.text} bg={p.faint} />
              <Text style={[styles.time, { color: p.text }]}>{formatTime(reminder)}</Text>
              <Stepper label="+" onPress={() => shiftTime(15)} color={p.text} bg={p.faint} />
            </View>
          )}
        </View>
      </Section>

      <Pressable
        onPress={submit}
        disabled={!canSave}
        style={[styles.save, { backgroundColor: color, opacity: canSave ? 1 : 0.4 }]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{submitLabel}</Text>
      </Pressable>

      {onDelete && (
        <Pressable onPress={onDelete} style={styles.delete} accessibilityRole="button">
          <Text style={{ color: p.danger, fontSize: 16, fontWeight: '600' }}>Delete habit</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Stepper({ label, onPress, color, bg }: { label: string; onPress: () => void; color: string; bg: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.stepper, { backgroundColor: bg }]}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Later' : 'Earlier'}
    >
      <Text style={{ color, fontSize: 22, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 48 },
  preview: { alignItems: 'center', paddingTop: 4 },
  bigEmoji: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  input: { fontSize: 18, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginLeft: 4 },
  box: { borderRadius: 14, padding: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emojiCell: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  dayChip: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, marginLeft: 4 },
  time: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  stepper: { width: 48, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  save: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  delete: { alignItems: 'center', paddingVertical: 8 },
});
