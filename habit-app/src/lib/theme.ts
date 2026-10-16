import { useColorScheme } from 'react-native';

/** iOS system colors offered for habits (light values; they read well on both themes). */
export const HABIT_COLORS = [
  { name: 'Blue', hex: '#007AFF' },
  { name: 'Teal', hex: '#30B0C7' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Red', hex: '#FF3B30' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Purple', hex: '#AF52DE' },
  { name: 'Indigo', hex: '#5856D6' },
];

const light = {
  scheme: 'light' as 'light' | 'dark',
  /** Grouped background (behind cards). */
  bg: '#F2F2F7',
  card: '#FFFFFF',
  /** A control or chip sitting on a card. */
  fill: 'rgba(118,118,128,0.12)',
  text: '#1D1D1F',
  /** Secondary text; darker than iOS's default gray so small text passes 4.5:1. */
  muted: '#6E6E73',
  faint: '#E5E5EA',
  separator: 'rgba(60,60,67,0.14)',
  border: 'rgba(0,0,0,0.06)',
  accent: '#0071E3',
  onAccent: '#FFFFFF',
  danger: '#FF3B30',
  shadow: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
};

const dark: typeof light = {
  scheme: 'dark',
  bg: '#000000',
  card: '#1C1C1E',
  fill: 'rgba(118,118,128,0.24)',
  text: '#F5F5F7',
  muted: '#A1A1A6',
  faint: '#2C2C2E',
  separator: 'rgba(84,84,88,0.45)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#2997FF',
  onAccent: '#FFFFFF',
  danger: '#FF453A',
  shadow: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Hex color with alpha, for tinted backgrounds. */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

export const FONT = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
};
