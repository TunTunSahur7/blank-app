import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { APP_STORE_URL } from '../lib/config';
import { useStrings, type Celebration as CelebrationData } from '../lib/store';
import { FONT, usePalette } from '../lib/theme';
import { HabitBadge, PrimaryButton, Ring, Sym } from './ui';


export function Celebration({ data, onClose }: { data: CelebrationData | null; onClose: () => void }) {
  const p = usePalette();
  const s = useStrings();
  const [scale] = useState(() => new Animated.Value(0.85));

  useEffect(() => {
    if (!data) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  }, [data, scale]);

  if (!data) return null;
  const { habit, streak } = data;

  const share = () =>
    Share.share({
      message: s.shareStreak(streak, habit.name) + (APP_STORE_URL ? ` ${APP_STORE_URL}` : ''),
    }).catch(() => {});

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { backgroundColor: p.card, transform: [{ scale }] }]}>
          <View style={styles.ringWrap}>
            <Ring progress={1} size={132} stroke={12} color={habit.color} track={`${habit.color}33`} />
            <View style={styles.ringCenter}>
              <HabitBadge icon={habit.icon} color={habit.color} size={56} />
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={styles.titleRow}>
              <Sym name="flame.fill" size={22} color="#FF9500" />
              <Text style={[FONT.title1, { color: p.text }]}>{s.streak(streak)}</Text>
            </View>
            <Text style={[FONT.subhead, { color: p.muted, textAlign: 'center' }]}>
              {habit.name}. {s.milestoneLines[streak] ?? s.milestoneDefault}
            </Text>
          </View>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <PrimaryButton title={s.keepGoing} onPress={onClose} color={habit.color} />
            <Pressable onPress={share} style={styles.share} accessibilityRole="button">
              <Sym name="square.and.arrow.up" size={16} color={p.accent} />
              <Text style={[FONT.headline, { color: p.accent }]}>{s.share}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 360, borderRadius: 28, padding: 24, paddingTop: 32, alignItems: 'center', gap: 22 },
  ringWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  share: { height: 44, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
});
