import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildBackup, parseBackup } from '../../lib/backup';
import { useHabits } from '../../lib/store';
import { usePalette } from '../../lib/theme';

export default function SettingsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { habits, allCheckins, restore, today } = useHabits();
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const file = new File(Paths.cache, `Daymark-backup-${today}.json`);
      if (file.exists) file.delete();
      file.create();
      await file.write(JSON.stringify(buildBackup(habits, allCheckins()), null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } catch {
      Alert.alert("Couldn't export", 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'public.json', '*/*'],
      copyToCacheDirectory: true,
    });
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
              await restore(backup.habits, backup.checkins);
              Alert.alert('Restored', 'Your habits are back.');
            } catch {
              Alert.alert("Couldn't restore", 'Nothing was changed. Please try again.');
            }
          },
        },
      ],
    );
  };

  const version = Constants.expoConfig?.version ?? '';

  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Text style={[styles.title, { color: p.text }]}>Settings</Text>

      <Group title="Your data" color={p.muted}>
        <View style={[styles.card, { backgroundColor: p.card }]}>
          <Text style={[styles.body, { color: p.text }]}>
            Your habits are stored only on this iPhone and included in your iCloud or computer backups. No account, no
            tracking, nothing sent to a server.
          </Text>
        </View>
        <Row label="Export backup file" onPress={exportBackup} disabled={busy} p={p} />
        <Row label="Restore from backup file" onPress={importBackup} disabled={busy} p={p} />
      </Group>

      <Group title="Reminders" color={p.muted}>
        <Row label="Notification settings" onPress={() => Linking.openSettings()} p={p} />
      </Group>

      <Group title="About" color={p.muted}>
        <View style={[styles.card, { backgroundColor: p.card }]}>
          <Text style={[styles.body, { color: p.text }]}>
            Daymark {version} · {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
          </Text>
        </View>
      </Group>
    </ScrollView>
  );
}

function Group({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.groupTitle, { color }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  onPress,
  disabled,
  p,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  p: ReturnType<typeof usePalette>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.card, styles.row, { backgroundColor: p.card, opacity: pressed || disabled ? 0.6 : 1 }]}
      accessibilityRole="button"
    >
      <Text style={{ color: p.accent, fontSize: 16, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: p.muted, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 24 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  groupTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginLeft: 4 },
  card: { borderRadius: 14, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { fontSize: 15, lineHeight: 21 },
});
