import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitBadge, PrimaryButton, Section, Sym } from '../../components/ui';
import { popular } from '../../lib/library';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

export default function PickHabitsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { create, lang } = useHabits();
  const STARTERS = popular(lang).map(({ id: _id, why: _why, ...input }) => input);
  const [picked, setPicked] = useState<Set<number>>(new Set([0, 1]));
  const [saving, setSaving] = useState(false);

  const toggle = (i: number) => {
    Haptics.selectionAsync();
    setPicked((prev) => {
      const n = new Set(prev);
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
      Alert.alert(s.somethingWrong, s.tryAgain);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={{ gap: 8, paddingHorizontal: 8 }}>
          <Text style={[styles.title, { color: p.text }]}>{s.pickTitle}</Text>
          <Text style={[FONT.callout, { color: p.muted, textAlign: 'center' }]}>
            {s.pickBody}
          </Text>
        </View>
        <Section>
          {STARTERS.map((h, i) => {
            const on = picked.has(i);
            return (
              <Pressable
                key={h.name}
                onPress={() => toggle(i)}
                style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fill : 'transparent' }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <HabitBadge icon={h.icon} color={h.color} size={34} />
                <View style={[styles.rowBody, i < STARTERS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                  <Text style={[FONT.body, { color: p.text, flex: 1 }]}>{h.name}</Text>
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
          title={picked.size === 0 ? s.pickAtLeastOne : s.continueWith(picked.size)}
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
