import { router } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark, PrimaryButton, Sym } from '../../components/ui';
import { FONT, usePalette } from '../../lib/theme';

const FEATURES: { icon: SFSymbol; title: string; body: string }[] = [
  { icon: 'checkmark.circle.fill', title: 'Unlimited habits, free', body: 'Track everything that matters to you. No limit, no paywall.' },
  { icon: 'calendar', title: 'Streaks that respect rest', body: 'Pick the days each habit repeats. Days off never break a streak.' },
  { icon: 'lock.fill', title: 'Private by design', body: 'Everything stays on your iPhone. No account, no tracking.' },
];

export default function WelcomeScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: p.scheme === 'dark' ? '#000' : '#FFF' }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 64 }]}>
        <View style={styles.hero}>
          <LogoMark size={92} />
          <Text style={[styles.title, { color: p.text }]}>Welcome to{'\n'}Daymark</Text>
        </View>
        <View style={{ gap: 28 }}>
          {FEATURES.map((f) => (
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
        <PrimaryButton title="Continue" onPress={() => router.push('/onboarding/habits')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 32, gap: 52 },
  hero: { alignItems: 'center', gap: 22 },
  title: { fontSize: 34, fontWeight: '700', textAlign: 'center', letterSpacing: 0.37, lineHeight: 40 },
  feature: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
});
