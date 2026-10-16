import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { iconFor } from '../lib/icons';
import { FONT, usePalette } from '../lib/theme';

/** Stroke paths for UI symbols where SF Symbols aren't available (web preview, Android). */
const FALLBACK: Partial<Record<SFSymbol, string>> = {
  checkmark: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  xmark: 'M6 6l12 12M18 6L6 18',
  'chevron.right': 'M9 5l7 7-7 7',
  'chevron.left': 'M15 5l-7 7 7 7',
  'flame.fill': 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-5.5.5-8z',
  'shield.fill': 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  'shield.lefthalf.filled': 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  'lock.fill': 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  'chart.bar.fill': 'M5 20V11M12 20V5M19 20v-6',
  'bell.fill': 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  'bell.badge.fill': 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  'gearshape.fill': 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1',
  'crown.fill': 'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z',
  'calendar': 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  'star.fill': 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  'square.and.arrow.up': 'M12 15V3M8 7l4-4 4 4M5 12v8h14v-8',
  'arrow.clockwise': 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  'heart.fill': 'M12 20s-7.5-4.6-9-9.2C2 7.5 4.2 5 7 5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 2.8 0 5 2.5 4 5.8C19.5 15.4 12 20 12 20z',
  'sparkles': 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z',
  'hand.raised.fill': 'M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-12 4l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15',
  'square.and.arrow.down': 'M12 3v12M8 11l4 4 4-4M5 14v6h14v-6',
  'arrow.down.doc.fill': 'M6 3h8l4 4v14H6zM12 10v7M9 14l3 3 3-3',
  'infinity': 'M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6z',
  'checkmark.circle.fill': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l3 3 5-6',
};

export function Sym({
  name,
  size = 20,
  color,
  weight = 'semibold',
  style,
}: {
  name: SFSymbol;
  size?: number;
  color: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}) {
  const d = FALLBACK[name] ?? FALLBACK.sparkles!;
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      style={[{ width: size, height: size }, style]}
      fallback={
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={d} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      }
    />
  );
}

/** A habit's icon on its colored tile, Settings-style. */
export function HabitBadge({ icon, color, size = 40 }: { icon: string; color: string; size?: number }) {
  const def = iconFor(icon);
  const glyph = Math.round(size * 0.52);
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <SymbolView
        name={def.sf}
        size={glyph}
        tintColor="#FFFFFF"
        weight="semibold"
        style={{ width: glyph, height: glyph }}
        fallback={
          <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
            <Path d={def.d} stroke="#FFFFFF" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        }
      />
    </View>
  );
}

/** Activity-style progress ring. */
export function Ring({
  progress,
  size,
  stroke,
  color,
  track,
}: {
  progress: number;
  size: number;
  stroke: number;
  color: string;
  track: string;
}) {
  const r = (size - stroke) / 2;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      {p > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${p * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </Svg>
  );
}

/** The Daymark mark: a loop that's almost closed, and today's dot in the gap. */
export function LogoMark({ size = 88, tile = true }: { size?: number; tile?: boolean }) {
  const c = 2 * Math.PI * 26;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {tile && (
        <>
          <Defs>
            <LinearGradient id="dm" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2E8BFF" />
              <Stop offset="1" stopColor="#0060DF" />
            </LinearGradient>
          </Defs>
          <Rect width={100} height={100} rx={22.4} fill="url(#dm)" />
        </>
      )}
      <Circle
        cx={50}
        cy={50}
        r={26}
        stroke={tile ? '#FFFFFF' : '#0071E3'}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * 0.8} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <Circle cx={34.7} cy={29} r={6} fill={tile ? '#FFFFFF' : '#0071E3'} />
    </Svg>
  );
}

/** Inset-grouped section: optional header and footer around a rounded card. */
export function Section({
  title,
  footer,
  right,
  children,
  style,
}: {
  title?: string;
  footer?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <View style={[{ gap: 7 }, style]}>
      {(title || right) && (
        <View style={styles.sectionHead}>
          {title ? <Text style={[FONT.footnote, styles.upper, { color: p.muted }]}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      <View style={[styles.card, { backgroundColor: p.card }, p.shadow]}>{children}</View>
      {footer && <Text style={[FONT.footnote, { color: p.muted, paddingHorizontal: 16, lineHeight: 18 }]}>{footer}</Text>}
    </View>
  );
}

/** A tappable settings-style row inside a Section. */
export function ListRow({
  label,
  detail,
  icon,
  iconColor,
  onPress,
  last,
  accessory = 'chevron',
  destructive,
  children,
}: {
  label: string;
  detail?: string;
  icon?: SFSymbol;
  iconColor?: string;
  onPress?: () => void;
  last?: boolean;
  accessory?: 'chevron' | 'none';
  destructive?: boolean;
  children?: ReactNode;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fill : 'transparent' }]}
    >
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconColor ?? p.accent }]}>
          <Sym name={icon} size={16} color="#FFFFFF" />
        </View>
      )}
      <View style={[styles.rowBody, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
        <Text style={[FONT.body, { color: destructive ? p.danger : p.text, flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        {detail && <Text style={[FONT.body, { color: p.muted }]}>{detail}</Text>}
        {children}
        {onPress && accessory === 'chevron' && <Sym name="chevron.right" size={13} color={p.muted} weight="bold" />}
      </View>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  color,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: color ?? p.accent, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[FONT.headline, { color: '#FFFFFF' }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16 },
  upper: { textTransform: 'uppercase' },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 48 },
  rowIcon: { width: 29, height: 29, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingRight: 16 },
  primary: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
