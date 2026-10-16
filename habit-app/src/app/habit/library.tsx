import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitBadge, Section, Sym } from '../../components/ui';
import { categoriesFor, localize, packsFor, type LibraryHabit, type Pack } from '../../lib/library';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const inputOf = ({ id: _id, why: _why, ...input }: LibraryHabit) => input;

export default function LibraryScreen() {
  const p = usePalette();
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const { habits, create, lang } = useHabits();
  const [category, setCategory] = useState('all');
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => categoriesFor(lang), [lang]);
  const packs = useMemo(() => packsFor(lang), [lang]);
  const have = useMemo(() => new Set(habits.map((h) => h.name.toLowerCase())), [habits]);
  const shown = category === 'all' ? categories : categories.filter((c) => c.id === category);
  const has = (h: LibraryHabit) => have.has(h.name.toLowerCase());

  const add = async (h: LibraryHabit) => {
    if (has(h)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await create(inputOf(h)).catch(() => Alert.alert(s.couldntAdd, s.tryAgain));
  };

  const addPack = async (pack: Pack) => {
    const missing = pack.habits.map((e) => localize(e, lang)).filter((h) => !has(h));
    if (missing.length === 0) return;
    setBusy(true);
    try {
      for (const h of missing) await create(inputOf(h));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(s.packAdded(pack.title[lang]), s.packAddedBody(missing.length), [
        { text: s.keepBrowsing, style: 'cancel' },
        { text: s.goToToday, onPress: () => router.dismissTo('/') },
      ]);
    } catch {
      Alert.alert(s.couldntAdd, s.tryAgain);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[styles.header, { borderBottomColor: p.separator }]}>
        <View style={{ width: 64 }} />
        <Text style={[FONT.headline, { color: p.text }]}>{s.libraryTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn} accessibilityRole="button">
          <Text style={[FONT.headline, { color: p.accent }]}>{s.done}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 22, paddingTop: 16 }}>
        <View style={{ gap: 10 }}>
          <Text style={[FONT.title3, { color: p.text, paddingHorizontal: 20 }]}>{s.packs}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packs}>
            {packs.map((pack) => {
              const items = pack.habits.map((e) => localize(e, lang));
              const missing = items.filter((h) => !has(h)).length;
              return (
                <Pressable
                  key={pack.id}
                  onPress={() => addPack(pack)}
                  disabled={busy || missing === 0}
                  style={({ pressed }) => [styles.pack, { backgroundColor: pack.color, borderColor: p.border, opacity: pressed ? 0.85 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${pack.title[lang]}: ${items.map((h) => h.name).join(', ')}. ${missing ? s.add : s.added}`}
                >
                  <View style={styles.packIcons}>
                    {items.slice(0, 4).map((h, i) => (
                      <View key={h.id} style={[styles.packIcon, { marginLeft: i ? -8 : 0 }]}>
                        <HabitBadge icon={h.icon} color={h.color} size={30} />
                      </View>
                    ))}
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={[FONT.headline, { color: '#FFFFFF' }]} numberOfLines={1}>{pack.title[lang]}</Text>
                    <Text style={[FONT.footnote, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>{pack.subtitle[lang]}</Text>
                  </View>
                  <View style={styles.packFoot}>
                    <Text style={[FONT.footnote, { color: 'rgba(255,255,255,0.85)' }]}>{s.habitsInPack(items.length)}</Text>
                    <View style={styles.packBtn}>
                      <Sym name={missing ? 'plus' : 'checkmark'} size={12} color={pack.color} weight="bold" />
                      <Text style={[FONT.footnote, { color: pack.color, fontWeight: '700' }]}>{missing ? s.add : s.added}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: 'all', label: s.all }, ...categories.map((c) => ({ id: c.id, label: c.title[lang] }))].map((c) => {
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
                <Text style={[FONT.subhead, { color: on ? p.bg : p.text, fontWeight: '600' }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, gap: 22 }}>
          {shown.map((c) => (
            <Section key={c.id} title={c.title[lang]}>
              {c.habits.map((entry, i) => {
                const h = localize(entry, lang);
                const added = has(h);
                return (
                  <View key={h.id} style={styles.row}>
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
                        accessibilityLabel={added ? `${h.name}: ${s.added}` : `${s.add} ${h.name}`}
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
