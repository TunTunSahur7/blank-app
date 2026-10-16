import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as StoreReview from 'expo-store-review';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow, LogoMark, Section } from '../../components/ui';
import { buildBackup, parseBackup } from '../../lib/backup';
import { APP_STORE_URL, MANAGE_SUBSCRIPTIONS_URL, PRIVACY_URL, TERMS_URL } from '../../lib/config';
import { SHIELDS_PER_MONTH, usePro } from '../../lib/purchases';
import { ensurePermission } from '../../lib/reminders';
import { useHabits } from '../../lib/store';
import { FONT, usePalette } from '../../lib/theme';

const pad = (n: number) => String(n).padStart(2, '0');

function timeAsDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function SettingsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { isPro, restore } = usePro();
  const {
    habits, allCheckins, shieldList, restore: restoreBackup, today, nudgeEnabled, nudgeTime, setSetting, shieldsUsedThisMonth,
  } = useHabits();
  const [busy, setBusy] = useState(false);

  const toggleNudge = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      Alert.alert('Notifications are off', 'Turn on notifications for Daymark in Settings to use Streak Guard.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    await setSetting('nudge_enabled', on ? '1' : '0');
  };

  const exportBackup = async () => {
    setBusy(true);
    try {
      const file = new File(Paths.cache, `Daymark-backup-${today}.json`);
      if (file.exists) file.delete();
      file.create();
      await file.write(JSON.stringify(buildBackup(habits, allCheckins(), shieldList), null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } catch {
      Alert.alert("Couldn't export", 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', '*/*'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    let backup;
    try {
      backup = parseBackup(await new File(picked.assets[0].uri).text());
    } catch (e) {
      Alert.alert("Couldn't import", e instanceof Error ? e.message : 'That file could not be read.');
      return;
    }
    Alert.alert(
      'Restore this backup?',
      `It has ${backup.habits.length} habits and ${backup.checkins.length} check-ins. Your current habits will be replaced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await restoreBackup(backup.habits, backup.checkins, backup.shields);
              Alert.alert('Restored', 'Your habits are back.');
            } catch {
              Alert.alert("Couldn't restore", 'Nothing was changed. Please try again.');
            }
          },
        },
      ],
    );
  };

  const restorePurchases = async () => {
    try {
      const pro = await restore();
      Alert.alert(pro ? 'Daymark Pro restored' : 'Nothing to restore', pro ? 'Welcome back.' : 'No Daymark Pro purchase was found for this Apple ID.');
    } catch {
      Alert.alert('Couldn’t restore', 'Please check your connection and try again.');
    }
  };

  const rate = async () => {
    if (APP_STORE_URL) Linking.openURL(`${APP_STORE_URL}?action=write-review`);
    else if (await StoreReview.isAvailableAsync()) StoreReview.requestReview();
  };

  const version = Constants.expoConfig?.version ?? '';
  const shieldsLeft = Math.max(0, SHIELDS_PER_MONTH - shieldsUsedThisMonth());

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}>
      <Text style={[FONT.largeTitle, { color: p.text, paddingHorizontal: 4, marginTop: 18 }]}>Settings</Text>

      <Pressable
        onPress={() => !isPro && router.push({ pathname: '/paywall', params: { from: 'settings' } })}
        disabled={isPro}
        style={({ pressed }) => [styles.pro, { backgroundColor: p.card, opacity: pressed ? 0.85 : 1 }, p.shadow]}
        accessibilityRole={isPro ? undefined : 'button'}
      >
        <LogoMark size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[FONT.headline, { color: p.text }]}>{isPro ? 'Daymark Pro' : 'Try Daymark Pro'}</Text>
          <Text style={[FONT.footnote, { color: p.muted }]}>
            {isPro
              ? `Thank you for your support. ${shieldsLeft} of ${SHIELDS_PER_MONTH} Streak Shields left this month.`
              : 'Streak Shields, interactive widgets, Insights and your full history. Free for 7 days.'}
          </Text>
        </View>
      </Pressable>

      <Section title="Streak Guard" footer="One evening nudge, only when a habit is still open. Finish your day and it stays quiet.">
        <ListRow label="Evening nudge" icon="bell.fill" iconColor="#FF3B30" last={!nudgeEnabled}>
          <Switch value={nudgeEnabled} onValueChange={toggleNudge} accessibilityLabel="Evening nudge" />
        </ListRow>
        {nudgeEnabled && (
          <ListRow label="Time" icon="calendar" iconColor="#FF9500" last>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                mode="time"
                display="compact"
                value={timeAsDate(nudgeTime)}
                minuteInterval={15}
                onValueChange={(_, d) => setSetting('nudge_time', `${pad(d.getHours())}:${pad(d.getMinutes())}`)}
              />
            ) : (
              <Text style={[FONT.body, { color: p.muted }]}>
                {timeAsDate(nudgeTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
            )}
          </ListRow>
        )}
      </Section>

      <Section title="Your data" footer="Your habits live only on this iPhone and in your iCloud or computer backups. No account, no tracking.">
        <ListRow label="Export Backup" icon="square.and.arrow.up" iconColor="#007AFF" onPress={busy ? undefined : exportBackup} />
        <ListRow label="Restore from Backup" icon="arrow.down.doc.fill" iconColor="#34C759" onPress={importBackup} last />
      </Section>

      <Section title="Support">
        <ListRow
          label="Add a Widget"
          icon="apps.iphone"
          iconColor="#007AFF"
          onPress={() =>
            Alert.alert(
              'Add a Daymark widget',
              'Touch and hold an empty spot on your Home Screen, tap Edit › Add Widget, then search for Daymark. For your Lock Screen, touch and hold it and tap Customize.',
            )
          }
        />
        <ListRow label="Rate Daymark" icon="star.fill" iconColor="#FF9500" onPress={rate} />
        <ListRow
          label="Share Daymark"
          icon="heart.fill"
          iconColor="#FF2D55"
          onPress={() => Share.share({ message: `I build my habits with Daymark.${APP_STORE_URL ? ` ${APP_STORE_URL}` : ''}` })}
        />
        <ListRow label="Restore Purchases" icon="arrow.clockwise" iconColor="#5856D6" onPress={restorePurchases} />
        {isPro && <ListRow label="Manage Subscription" icon="crown.fill" iconColor="#AF52DE" onPress={() => Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)} />}
        <ListRow label="Notification Settings" icon="gearshape.fill" iconColor="#8E8E93" onPress={() => Linking.openSettings()} last />
      </Section>

      <Section title="About">
        <ListRow label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <ListRow label="Terms of Use" onPress={() => Linking.openURL(TERMS_URL)} />
        <ListRow label="Version" detail={version} accessory="none" last />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 24 },
  pro: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
});
