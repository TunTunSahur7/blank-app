import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { usePalette } from '../lib/theme';
import { Sym } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** How long a press must last to count. Long enough to be deliberate, short enough to feel instant. */
export const HOLD_MS = 420;

type Props = {
  done: boolean;
  color: string;
  size?: number;
  label: string;
  onComplete: () => void;
  /** A short tap: the person hasn't learned to hold yet. */
  onTap?: () => void;
};

/**
 * Press and hold to mark a habit done: a ring fills around the circle and the check lands
 * with a haptic thump. Holding makes every check-in a small, deliberate act, the way
 * Streaks does it, and stops accidental taps while scrolling. VoiceOver activates instantly.
 */
export function HoldCheck({ done, color, size = 44, label, onComplete, onTap }: Props) {
  const p = usePalette();
  const [fill] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(1));
  const fired = useRef(false);
  const stroke = Math.max(3, Math.round(size * 0.09));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const track = p.scheme === 'dark' ? '#3A3A3C' : '#D1D1D6';

  const complete = () => {
    fired.current = true;
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    if (!done) {
      pop.setValue(0.7);
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 170, useNativeDriver: Platform.OS !== 'web' }).start();
    }
    fill.setValue(0);
    onComplete();
  };

  const pressIn = () => {
    fired.current = false;
    Haptics.selectionAsync();
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(
      ({ finished }) => finished && !fired.current && complete(),
    );
  };

  const pressOut = () => {
    if (fired.current) return;
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 0, duration: 160, useNativeDriver: false }).start();
  };

  const offset = fill.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });
  const inner = size - stroke * 2 - 4;

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => !fired.current && onTap?.()}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => complete()}
      style={{ width: size, height: size }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ scale: pop }] }]}>
        {done ? (
          <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
            <Sym name="checkmark" size={Math.round(size * 0.46)} color="#FFFFFF" weight="heavy" />
          </View>
        ) : (
          <View style={[{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: `${color}14` }]} />
        )}
      </Animated.View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        {!done && <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? '#FFFFFF' : color}
          strokeOpacity={done ? 0.55 : 1}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
