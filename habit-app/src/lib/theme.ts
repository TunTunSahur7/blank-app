import { useColorScheme } from 'react-native';

export const HABIT_COLORS = ['#FF6B4A', '#FFA81F', '#2DBE60', '#00B2C9', '#3D7BFF', '#8E5CFF', '#F2509A', '#8792A8'];

export const HABIT_EMOJI = [
  '💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🦷',
  '✍️', '🎸', '🧠', '🌱', '🚶', '☀️', '🚭', '💊',
  '🧹', '💰', '📵', '🙏', '🎨', '🐶', '🍎', '❤️',
];

const light = {
  bg: '#F6F5F2',
  card: '#FFFFFF',
  text: '#16161A',
  muted: '#6E6E78',
  faint: '#E7E5E0',
  accent: '#3D7BFF',
  danger: '#E5484D',
};

const dark: typeof light = {
  bg: '#0E0E10',
  card: '#1A1A1E',
  text: '#F3F3F5',
  muted: '#9A9AA5',
  faint: '#2A2A30',
  accent: '#6E9BFF',
  danger: '#FF6369',
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
