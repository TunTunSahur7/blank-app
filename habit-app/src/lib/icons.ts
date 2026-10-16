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
  { key: 'steps', label: 'Steps', sf: 'shoeprints.fill', d: 'M8 3c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5zM16 9c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5zM6 16h4M14 21h4' },
  { key: 'stretch', label: 'Stretch', sf: 'figure.flexibility', d: 'M12 3a2 2 0 1 0 0 .01M4 8l8 2 8-2M12 10v5l-4 6M12 15l4 6' },
  { key: 'yoga', label: 'Yoga', sf: 'figure.yoga', d: 'M12 3a2 2 0 1 0 0 .01M5 11l7-2 7 2M12 9v7M8 21l4-5 4 5' },
  { key: 'pushups', label: 'Push-ups', sf: 'figure.strengthtraining.traditional', d: 'M3 18h18M5 14l6-3 8 1M7 18l2-4' },
  { key: 'focus', label: 'Focus', sf: 'brain.head.profile', d: 'M9 21v-3H6a2 2 0 0 1-2-2v-3L2 11l2-1V8a6 6 0 0 1 12 0c0 2-1 3.5-2 4.5V21' },
  { key: 'plan', label: 'Plan', sf: 'checklist', d: 'M4 6l2 2 3-3M4 13l2 2 3-3M12 7h8M12 14h8M12 20h8' },
  { key: 'timer', label: 'Deep work', sf: 'timer', d: 'M12 8v5l3 2M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 2h4' },
  { key: 'inbox', label: 'Inbox', sf: 'tray.fill', d: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5' },
  { key: 'bed', label: 'Make bed', sf: 'bed.double.fill', d: 'M3 18V8M21 18v-5H3M7 13V10h5v3M3 18h18' },
  { key: 'alarm', label: 'Wake early', sf: 'alarm.fill', d: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M5 3L2 6M19 3l3 3' },
  { key: 'nospend', label: 'No spend', sf: 'creditcard.fill', d: 'M3 6h18v12H3zM3 10h18M7 15h3' },
  { key: 'call', label: 'Call', sf: 'phone.fill', d: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z' },
  { key: 'kind', label: 'Kindness', sf: 'gift.fill', d: 'M4 10h16v11H4zM2 7h20v3H2zM12 7v14M12 7c-2-4-6-4-6-1 0 1 1 1 6 1zM12 7c2-4 6-4 6-1 0 1-1 1-6 1z' },
  { key: 'partner', label: 'Together', sf: 'person.2.fill', d: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M18 20a6 6 0 0 0-3-5' },
  { key: 'pet', label: 'Pet', sf: 'dog.fill', d: 'M5 9l2-5 3 3h4l3-3 2 5v6a6 6 0 0 1-14 0zM10 13h.01M14 13h.01' },
  { key: 'gratitude', label: 'Gratitude', sf: 'hands.and.sparkles.fill', d: 'M7 21v-6l-3-4 2-1 3 3V5a1.5 1.5 0 0 1 3 0v8M12 13V4a1.5 1.5 0 0 1 3 0v9M15 13V7a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6H7' },
  { key: 'breath', label: 'Breathwork', sf: 'lungs.fill', d: 'M12 4v8M12 12c-2-1-3-3-5-3-2 0-3 4-3 8 0 2 1 3 3 3s3-2 3-5zM12 12c2-1 3-3 5-3 2 0 3 4 3 8 0 2-1 3-3 3s-3-2-3-5z' },
  { key: 'language', label: 'Language', sf: 'character.book.closed.fill', d: 'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M9 8h6M12 8v5' },
  { key: 'learn', label: 'Learn', sf: 'graduationcap.fill', d: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6' },
  { key: 'veggies', label: 'Veggies', sf: 'carrot.fill', d: 'M4 20l9-9 3 3-9 9zM13 11c1-3 3-5 7-5-1 3-2 5-4 6M16 8l3-5' },
  { key: 'coffee', label: 'Caffeine', sf: 'cup.and.saucer.fill', d: 'M5 8h11v6a5 5 0 0 1-10 0zM16 10h2a2 2 0 0 1 0 4h-2M3 21h16' },
  { key: 'floss', label: 'Teeth', sf: 'mouth.fill', d: 'M3 12c3-4 6-5 9-3 3-2 6-1 9 3-3 5-6 7-9 7s-6-2-9-7zM3 12h18' },
  { key: 'cold', label: 'Cold shower', sf: 'shower.fill', d: 'M6 20V8a4 4 0 0 1 8 0M10 8h8M12 12v1M15 12v1M18 12v1M12 16v1M15 16v1M18 16v1' },
  { key: 'outdoors', label: 'Outdoors', sf: 'tree.fill', d: 'M12 3l6 8h-3l4 6H5l4-6H6zM12 17v4' },
  { key: 'home', label: 'Home', sf: 'house.fill', d: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6' },
  { key: 'art', label: 'Create', sf: 'paintpalette.fill', d: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8zM7.5 11h.01M10 7h.01M15 7h.01' },
  { key: 'photo', label: 'Photo', sf: 'camera.fill', d: 'M3 8h4l2-3h6l2 3h4v11H3zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z' },
  { key: 'noalcohol', label: 'No alcohol', sf: 'wineglass.fill', d: 'M8 3h8v5a4 4 0 0 1-8 0zM12 12v8M8 21h8' },
  { key: 'nosmoke', label: 'No smoking', sf: 'nosign', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8' },
  { key: 'social', label: 'Social media', sf: 'bubble.left.and.bubble.right.fill', d: 'M3 5h12v8H8l-4 3v-3H3zM17 9h4v8h-1v3l-3-3h-6v-2' },
];

const BY_KEY = new Map(ICONS.map((i) => [i.key, i]));

export function iconFor(key: string): IconDef {
  return BY_KEY.get(key) ?? ICONS[0];
}
