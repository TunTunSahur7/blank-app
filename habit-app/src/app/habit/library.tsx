import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitBadge, Section, Sym } from '../../components/ui';
import { CATEGORIES, PACKS, type LibraryHabit, type Pack } from '../../lib/library';
import { useHabits } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

export default function LibraryScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { habits, create } = useHabits();
  const [category, setCategory] = useState('all');
  const [busy, setBusy] = useState(false);

  const have = useMemo(() => new Set(habits.map((h) => h.name.toLowerCase())), [habits]);
  const shown = category === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === category);

  const add = async (h: LibraryHabit) => {
    if (have.has(h.name.toLowerCase())) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { why: _why, ...input } = h;
    await create(input).catch(() => Alert.alert("Couldn't add", 'Please try again.'));
  };

  const addPack = async (pack: Pack) => {
    const missing = pack.habits.filter((h) => !have.has(h.name.toLowerCase()));
    if (missing.length === 0) return;
    setBusy(true);
    try {
      for (const h of missing) {
        const { why: _why, ...input } = h;
        await create(input);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(`${pack.title} added`, `${missing.length} new ${missing.length === 1 ? 'habit is' : 'habits are'} on your Today list.`, [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Go to Today', onPress: () => router.dismissTo('/') },
      ]);
    } catch {
      Alert.alert("Couldn't add", 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[styles.header, { borderBottomColor: p.separator }]}>
        <View style={{ width: 64 }} />
        <Text style={[FONT.headline, { color: p.text }]}>Habit Library</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn} accessibilityRole="button">
          <Text style={[FONT.headline, { color: p.accent }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 22, paddingTop: 16 }}>
        <View style={{ gap: 10 }}>
          <Text style={[FONT.title3, { color: p.text, paddingHorizontal: 20 }]}>Packs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packs}>
            {PACKS.map((pack) => {
              const missing = pack.habits.filter((h) => !have.has(h.name.toLowerCase())).length;
              return (
                <Pressable
                  key={pack.id}
                  onPress={() => addPack(pack)}
                  disabled={busy || missing === 0}
                  style={({ pressed }) => [styles.pack, { backgroundColor: pack.color, borderColor: p.border, opacity: pressed ? 0.85 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${pack.title}: ${pack.habits.map((h) => h.name).join(', ')}. ${missing ? 'Add pack' : 'Added'}`}
                >
                  <View style={styles.packIcons}>
                    {pack.habits.slice(0, 4).map((h, i) => (
                      <View key={h.name} style={[styles.packIcon, { marginLeft: i ? -8 : 0 }]}>
                        <HabitBadge icon={h.icon} color={h.color} size={30} />
                      </View>
                    ))}
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={[FONT.headline, { color: '#FFFFFF' }]}>{pack.title}</Text>
                    <Text style={[FONT.footnote, { color: 'rgba(255,255,255,0.85)' }]}>{pack.subtitle}</Text>
                  </View>
                  <View style={styles.packFoot}>
                    <Text style={[FONT.footnote, { color: 'rgba(255,255,255,0.85)' }]}>{pack.habits.length} habits</Text>
                    <View style={styles.packBtn}>
                      <Sym name={missing ? 'plus' : 'checkmark'} size={12} color={pack.color} weight="bold" />
                      <Text style={[FONT.footnote, { color: pack.color, fontWeight: '700' }]}>{missing ? 'Add' : 'Added'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: 'all', title: 'All' }, ...CATEGORIES].map((c) => {
            const on = c.id === category;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(c.id);
                }}
                style={[styles.chip, { backgroundColor: on ? p.text : p.card }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Text style={[FONT.subhead, { color: on ? p.bg : p.text, fontWeight: '600' }]}>{c.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, gap: 22 }}>
          {shown.map((c) => (
            <Section key={c.id} title={c.title}>
              {c.habits.map((h, i) => {
                const added = have.has(h.name.toLowerCase());
                return (
                  <View key={h.name} style={styles.row}>
                    <HabitBadge icon={h.icon} color={h.color} size={36} />
                    <View style={[styles.rowBody, i < c.habits.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[FONT.headline, { color: p.text }]}>{h.name}</Text>
                        <Text style={[FONT.footnote, { color: p.muted }]}>{h.why}</Text>
                      </View>
                      <Pressable
                        onPress={() => add(h)}
                        disabled={added}
                        hitSlop={8}
                        style={[styles.addBtn, { backgroundColor: added ? 'transparent' : `${p.accent}1F` }]}
                        accessibilityRole="button"
                        accessibilityLabel={added ? `${h.name} added` : `Add ${h.name}`}
                      >
                        <Sym name={added ? 'checkmark.circle.fill' : 'plus'} size={added ? 26 : 15} color={added ? '#34C759' : p.accent} weight="bold" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </Section>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { minWidth: 64, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  packs: { paddingHorizontal: 16, gap: 12 },
  pack: { width: 196, height: 176, borderRadius: 22, padding: 16, justifyContent: 'space-between', borderWidth: 1 },
  packIcons: { flexDirection: 'row' },
  packIcon: { borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  packFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingRight: 14, minHeight: 64 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
