import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, Sym } from '../../components/ui';
import { ensurePermission } from '../../lib/reminders';
import { formatTime } from '../../lib/i18n';
import { useHabits, useStrings } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

export default function StreakGuardScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const { setSetting, lang } = useHabits();
  const [busy, setBusy] = useState(false);

  const finish = async (enable: boolean) => {
    setBusy(true);
    try {
      const granted = enable ? await ensurePermission() : false;
      await setSetting('nudge_enabled', granted ? '1' : '0');
      // Keep the language chosen (or detected) during onboarding.
      await setSetting('lang', lang);
      await setSetting('onboarded', '1');
    } finally {
      setBusy(false);
    }
    router.replace({ pathname: '/paywall', params: { from: 'onboarding' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.scheme === 'dark' ? '#000' : '#FFF' }}>
      <View style={[styles.content, { paddingTop: insets.top + 96 }]}>
        <View style={[styles.bell, { backgroundColor: `${p.accent}1F` }]}>
          <Sym name="bell.badge.fill" size={46} color={p.accent} weight="regular" />
        </View>
        <Text style={[styles.title, { color: p.text }]}>{s.guardTitle}</Text>
        <Text style={[FONT.callout, { color: p.muted, textAlign: 'center', lineHeight: 22 }]}>
          {s.guardBody}
        </Text>
        <View style={[styles.sample, { backgroundColor: p.scheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
          <View style={styles.sampleIcon}>
            <Sym name="checkmark" size={14} color="#FFFFFF" weight="heavy" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[FONT.subhead, { color: p.text, fontWeight: '600' }]}>{s.guardSampleTitle}</Text>
            <Text style={[FONT.footnote, { color: p.muted }]}>{s.guardSampleBody}</Text>
          </View>
          <Text style={[FONT.caption, { color: p.muted }]}>{formatTime('20:00', s)}</Text>
        </View>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <PrimaryButton title={s.guardTurnOn} onPress={() => finish(true)} loading={busy} />
        <Pressable onPress={() => finish(false)} disabled={busy} style={styles.skip} accessibilityRole="button">
          <Text style={[FONT.body, { color: p.accent }]}>{s.notNow}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 32, alignItems: 'center', gap: 18 },
  bell: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', letterSpacing: 0.36 },
  sample: { marginTop: 16, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20 },
  sampleIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#0071E3', alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, gap: 4 },
  skip: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
