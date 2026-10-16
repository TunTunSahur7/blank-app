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
import { formatTime } from '../../lib/i18n';
import { SHIELDS_PER_MONTH, usePro } from '../../lib/purchases';
import { ensurePermission } from '../../lib/reminders';
import { useHabits, useStrings } from '../../lib/store';
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
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const { isPro, restore } = usePro();
  const {
    habits, allCheckins, shieldList, restore: restoreBackup, today, nudgeEnabled, nudgeTime, setSetting, shieldsUsedThisMonth, lang,
  } = useHabits();
  const [busy, setBusy] = useState(false);

  const toggleNudge = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      Alert.alert(s.notificationsOff, s.guardNeedsNotifications, [
        { text: s.cancel, style: 'cancel' },
        { text: s.openSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    await setSetting('nudge_enabled', on ? '1' : '0');
  };

  const chooseLanguage = () =>
    Alert.alert(s.language, undefined, [
      { text: 'Shqip', onPress: () => setSetting('lang', 'sq') },
      { text: 'English', onPress: () => setSetting('lang', 'en') },
      { text: s.cancel, style: 'cancel' },
    ]);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const file = new File(Paths.cache, `Besa-backup-${today}.json`);
      if (file.exists) file.delete();
      file.create();
      await file.write(JSON.stringify(buildBackup(habits, allCheckins(), shieldList), null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } catch {
      Alert.alert(s.couldntExport, s.tryAgain);
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
      Alert.alert(s.couldntImport, e instanceof Error ? e.message : s.fileUnreadable);
      return;
    }
    Alert.alert(s.restoreTitle, s.restoreBody(backup.habits.length, backup.checkins.length), [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.restore,
        style: 'destructive',
        onPress: async () => {
          try {
            await restoreBackup(backup.habits, backup.checkins, backup.shields);
            Alert.alert(s.restoredTitle, s.restoredBody);
          } catch {
            Alert.alert(s.couldntRestore, s.nothingChanged);
          }
        },
      },
    ]);
  };

  const restorePurchases = async () => {
    try {
      const pro = await restore();
      Alert.alert(pro ? s.proRestored : s.nothingToRestore, pro ? s.welcomeBack : s.noPurchaseFound);
    } catch {
      Alert.alert(s.couldntRestoreTitle, s.couldntRestorePurchases);
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
      <Text style={[FONT.largeTitle, { color: p.text, paddingHorizontal: 4, marginTop: 18 }]}>{s.settingsTitle}</Text>

      <Pressable
        onPress={() => !isPro && router.push({ pathname: '/paywall', params: { from: 'settings' } })}
        disabled={isPro}
        style={({ pressed }) => [styles.pro, { backgroundColor: p.card, opacity: pressed ? 0.85 : 1 }, p.shadow]}
        accessibilityRole={isPro ? undefined : 'button'}
      >
        <LogoMark size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[FONT.headline, { color: p.text }]}>{isPro ? s.proTitle : s.tryPro}</Text>
          <Text style={[FONT.footnote, { color: p.muted }]}>{isPro ? s.proThanks(shieldsLeft, SHIELDS_PER_MONTH) : s.proPitch}</Text>
        </View>
      </Pressable>

      <Section>
        <ListRow label={s.language} icon="globe" iconColor="#007AFF" detail={lang === 'sq' ? 'Shqip' : 'English'} onPress={chooseLanguage} last />
      </Section>

      <Section title={s.streakGuard} footer={s.streakGuardFooter}>
        <ListRow label={s.eveningNudge} icon="bell.fill" iconColor="#FF3B30" last={!nudgeEnabled}>
          <Switch value={nudgeEnabled} onValueChange={toggleNudge} accessibilityLabel={s.eveningNudge} />
        </ListRow>
        {nudgeEnabled && (
          <ListRow label={s.time} icon="calendar" iconColor="#FF9500" last>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                mode="time"
                display="compact"
                value={timeAsDate(nudgeTime)}
                minuteInterval={15}
                locale={lang === 'sq' ? 'sq_AL' : undefined}
                onValueChange={(_, d) => setSetting('nudge_time', `${pad(d.getHours())}:${pad(d.getMinutes())}`)}
              />
            ) : (
              <Text style={[FONT.body, { color: p.muted }]}>{formatTime(nudgeTime, s)}</Text>
            )}
          </ListRow>
        )}
      </Section>

      <Section title={s.yourData} footer={s.yourDataFooter}>
        <ListRow label={s.exportBackup} icon="square.and.arrow.up" iconColor="#007AFF" onPress={busy ? undefined : exportBackup} />
        <ListRow label={s.restoreBackup} icon="arrow.down.doc.fill" iconColor="#34C759" onPress={importBackup} last />
      </Section>

      <Section title={s.support}>
        <ListRow label={s.addWidget} icon="apps.iphone" iconColor="#007AFF" onPress={() => Alert.alert(s.addWidgetTitle, s.addWidgetBody)} />
        <ListRow label={s.rateApp} icon="star.fill" iconColor="#FF9500" onPress={rate} />
        <ListRow
          label={s.shareApp}
          icon="heart.fill"
          iconColor="#FF2D55"
          onPress={() => Share.share({ message: s.shareAppText + (APP_STORE_URL ? ` ${APP_STORE_URL}` : '') })}
        />
        <ListRow label={s.restorePurchases} icon="arrow.clockwise" iconColor="#5856D6" onPress={restorePurchases} />
        {isPro && <ListRow label={s.manageSubscription} icon="crown.fill" iconColor="#AF52DE" onPress={() => Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)} />}
        <ListRow label={s.notificationSettings} icon="gearshape.fill" iconColor="#8E8E93" onPress={() => Linking.openSettings()} last />
      </Section>

      <Section title={s.about}>
        <ListRow label={s.privacyPolicy} onPress={() => Linking.openURL(PRIVACY_URL)} />
        <ListRow label={s.termsOfUse} onPress={() => Linking.openURL(TERMS_URL)} />
        <ListRow label={s.version} detail={version} accessory="none" last />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 24 },
  pro: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
});
