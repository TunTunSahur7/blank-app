import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark, PrimaryButton, Sym } from '../../components/ui';
import { APP_NAME, type Lang } from '../../lib/i18n';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'sq', label: 'Shqip' },
  { id: 'en', label: 'English' },
];

export default function WelcomeScreen() {
  const p = usePalette();
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const { lang, setSetting } = useHabits();

  const features: { icon: SFSymbol; title: string; body: string }[] = [
    { icon: 'checkmark.circle.fill', title: s.featureFreeTitle, body: s.featureFreeBody },
    { icon: 'calendar', title: s.featureRestTitle, body: s.featureRestBody },
    { icon: 'lock.fill', title: s.featurePrivateTitle, body: s.featurePrivateBody },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: p.scheme === 'dark' ? '#000' : '#FFF' }}>
      <View style={[styles.langRow, { top: insets.top + 12, backgroundColor: p.fill }]} accessibilityRole="tablist">
        {LANGS.map((l) => {
          const on = l.id === lang;
          return (
            <Pressable
              key={l.id}
              onPress={() => {
                Haptics.selectionAsync();
                setSetting('lang', l.id);
              }}
              style={[styles.langBtn, on && { backgroundColor: p.card }, on && p.shadow]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[FONT.footnote, { color: p.text, fontWeight: on ? '600' : '400' }]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 84 }]}>
        <View style={styles.hero}>
          <LogoMark size={92} />
          <Text style={[styles.title, { color: p.text }]}>
            {s.welcomeTo}
            {'\n'}
            {APP_NAME}
          </Text>
          <Text style={[FONT.callout, { color: p.muted, textAlign: 'center', marginTop: -10 }]}>{s.tagline}</Text>
        </View>
        <View style={{ gap: 28 }}>
          {features.map((f) => (
            <View key={f.title} style={styles.feature}>
              <Sym name={f.icon} size={30} color={p.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[FONT.headline, { color: p.text }]}>{f.title}</Text>
                <Text style={[FONT.subhead, { color: p.muted, lineHeight: 20 }]}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton title={s.continue} onPress={() => router.push('/onboarding/habits')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  langRow: { position: 'absolute', right: 20, zIndex: 1, flexDirection: 'row', borderRadius: 9, padding: 2 },
  langBtn: { paddingHorizontal: 12, height: 30, borderRadius: 7, justifyContent: 'center' },
  content: { paddingHorizontal: 32, gap: 52 },
  hero: { alignItems: 'center', gap: 22 },
  title: { fontSize: 34, fontWeight: '700', textAlign: 'center', letterSpacing: 0.37, lineHeight: 40 },
  feature: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
