import { getLocales } from 'expo-localization';

import type { Lang } from './i18n';

/** Regions where Albanian is the main language. iOS can't be set to Albanian, so region decides. */
const ALBANIAN_REGIONS = new Set(['AL', 'XK']);

export function detectLanguage(): Lang {
  try {
    for (const l of getLocales()) {
      if (l.languageCode === 'sq') return 'sq';
      if (l.regionCode && ALBANIAN_REGIONS.has(l.regionCode)) return 'sq';
    }
  } catch {
    // Fall through to English.
  }
  return 'en';
}
