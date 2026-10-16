import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitBadge, PrimaryButton, Section, Sym } from '../../components/ui';
import { ALL_DAYS } from '../../lib/dates';
import type { HabitInput } from '../../lib/db';
import { useHabits } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const WEEKDAYS = 0b0111110;

const STARTERS: HabitInput[] = [
  { name: 'Drink water', icon: 'water', color: '#007AFF', days: ALL_DAYS, reminder: null },
  { name: 'Read 10 pages', icon: 'read', color: '#FF9500', days: ALL_DAYS, reminder: null },
  { name: 'Move 30 minutes', icon: 'run', color: '#34C759', days: ALL_DAYS, reminder: null },
  { name: 'Meditate', icon: 'meditate', color: '#5856D6', days: ALL_DAYS, reminder: null },
  { name: 'Sleep by 11', icon: 'sleep', color: '#AF52DE', days: ALL_DAYS, reminder: null },
  { name: 'Journal', icon: 'journal', color: '#30B0C7', days: ALL_DAYS, reminder: null },
  { name: 'Strength training', icon: 'strength', color: '#FF3B30', days: 0b0101010, reminder: null },
  { name: 'Less phone time', icon: 'nophone', color: '#FF2D55', days: WEEKDAYS, reminder: null },
];

export default function PickHabitsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { create } = useHabits();
  const [picked, setPicked] = useState<Set<number>>(new Set([0, 1]));
  const [saving, setSaving] = useState(false);

  const toggle = (i: number) => {
    Haptics.selectionAsync();
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const next = async () => {
    setSaving(true);
    try {
      for (const i of [...picked].sort()) await create(STARTERS[i]);
      router.push('/onboarding/reminders');
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={{ gap: 8, paddingHorizontal: 8 }}>
          <Text style={[styles.title, { color: p.text }]}>Pick a few to start</Text>
          <Text style={[FONT.callout, { color: p.muted, textAlign: 'center' }]}>
            Small and specific works best. You can change these anytime.
          </Text>
        </View>
        <Section>
          {STARTERS.map((s, i) => {
            const on = picked.has(i);
            return (
              <Pressable
                key={s.name}
                onPress={() => toggle(i)}
                style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fill : 'transparent' }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <HabitBadge icon={s.icon} color={s.color} size={34} />
                <View style={[styles.rowBody, i < STARTERS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                  <Text style={[FONT.body, { color: p.text, flex: 1 }]}>{s.name}</Text>
                  <View
                    style={[
                      styles.check,
                      on ? { backgroundColor: p.accent, borderColor: p.accent } : { borderColor: p.scheme === 'dark' ? '#48484A' : '#C7C7CC' },
                    ]}
                  >
                    {on && <Sym name="checkmark" size={13} color="#FFFFFF" weight="heavy" />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Section>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: p.bg }]}>
        <PrimaryButton
          title={picked.size === 0 ? 'Pick at least one' : `Continue with ${picked.size}`}
          onPress={next}
          disabled={picked.size === 0}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 28, paddingBottom: 24 },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', letterSpacing: 0.36 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingRight: 16 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
