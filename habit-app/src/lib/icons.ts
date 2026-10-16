import type { SFSymbol } from 'expo-symbols';

/**
 * Habit icons. On iOS they render as SF Symbols; `d` is a 24×24 stroke path used where
 * SF Symbols aren't available (Android, web previews).
 */
export type IconDef = { key: string; label: string; sf: SFSymbol; d: string };

export const ICONS: IconDef[] = [
  { key: 'water', label: 'Water', sf: 'drop.fill', d: 'M12 3.5s-6 6.2-6 10.5a6 6 0 0 0 12 0C18 9.7 12 3.5 12 3.5z' },
  { key: 'read', label: 'Read', sf: 'book.fill', d: 'M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3zM21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z' },
  { key: 'run', label: 'Run', sf: 'figure.run', d: 'M3 12h4l3-8 4 16 3-8h4' },
  { key: 'walk', label: 'Walk', sf: 'figure.walk', d: 'M13 4a1.5 1.5 0 1 0 0 .01M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3M11 8l-3 2-1 3' },
  { key: 'breathe', label: 'Breathe', sf: 'wind', d: 'M4 9h10.5a3 3 0 1 0-3-3M4 15h13a3 3 0 1 1-3 3M4 12h6' },
  { key: 'meditate', label: 'Meditate', sf: 'figure.mind.and.body', d: 'M12 3a2 2 0 1 0 0 .01M4 20c3-1 5-2 8-2s5 1 8 2M7 14l5-4 5 4M12 10v6' },
  { key: 'sleep', label: 'Sleep', sf: 'moon.fill', d: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' },
  { key: 'strength', label: 'Strength', sf: 'dumbbell.fill', d: 'M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12' },
  { key: 'nature', label: 'Nature', sf: 'leaf.fill', d: 'M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7' },
  { key: 'journal', label: 'Journal', sf: 'pencil', d: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4' },
  { key: 'music', label: 'Music', sf: 'music.note', d: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { key: 'heart', label: 'Health', sf: 'heart.fill', d: 'M12 20s-7.5-4.6-9-9.2C2 7.5 4.2 5 7 5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 2.8 0 5 2.5 4 5.8C19.5 15.4 12 20 12 20z' },
  { key: 'pill', label: 'Medicine', sf: 'pills.fill', d: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7' },
  { key: 'sun', label: 'Morning', sf: 'sun.max.fill', d: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4' },
  { key: 'food', label: 'Eat well', sf: 'fork.knife', d: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12' },
  { key: 'nophone', label: 'Less phone', sf: 'iphone.slash', d: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 3l18 18' },
  { key: 'money', label: 'Save', sf: 'dollarsign.circle.fill', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2.2 0 3 6 1.6 6 4.6 0 1.4-1.3 2.2-3 2.2-1.4 0-2.5-.5-3-1.5M12 6v12' },
  { key: 'clean', label: 'Tidy', sf: 'sparkles', d: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' },
];

const BY_KEY = new Map(ICONS.map((i) => [i.key, i]));

export function iconFor(key: string): IconDef {
  return BY_KEY.get(key) ?? ICONS[0];
}
