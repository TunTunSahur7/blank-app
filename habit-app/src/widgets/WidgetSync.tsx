import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { usePro } from '../lib/purchases';
import { useHabits } from '../lib/store';
import { editsFrom, widgetTimeline } from './props';

type WidgetModule = typeof import('./TodayWidget');
let widgetModule: Promise<WidgetModule> | null = null;
const loadWidget = () => (widgetModule ??= import('./TodayWidget'));

/**
 * Keeps the Home Screen widget and the app in step (iOS only, renders nothing).
 * Check-offs made on the widget are stored in its timeline; they're applied to the database
 * first, and only then is a fresh timeline pushed — so a widget tap is never overwritten.
 */
export function WidgetSync() {
  const { ready, habits, done, shields, today, setCheckins } = useHabits();
  const { isPro } = usePro();
  const pulling = useRef<Promise<void>>(Promise.resolve());
  const setCheckinsRef = useRef(setCheckins);

  useEffect(() => {
    setCheckinsRef.current = setCheckins;
  }, [setCheckins]);

  // Collect widget check-offs on launch, whenever the app comes forward, and on widget taps.
  useEffect(() => {
    if (Platform.OS !== 'ios' || !ready) return;
    const pull = () => {
      pulling.current = pulling.current.then(async () => {
        try {
          const { default: widget } = await loadWidget();
          const changes = editsFrom(await widget.getTimeline());
          await setCheckinsRef.current(changes);
        } catch {
          // Widget unavailable (e.g. extension not installed yet): nothing to collect.
        }
      });
    };
    pull();
    const appSub = AppState.addEventListener('change', (s) => s === 'active' && pull());
    let tapSub: { remove: () => void } | null = null;
    import('expo-widgets')
      .then((m) => {
        tapSub = m.addUserInteractionListener(pull);
      })
      .catch(() => {});
    return () => {
      appSub.remove();
      tapSub?.remove();
    };
  }, [ready]);

  // Push the current state after any change.
  useEffect(() => {
    if (Platform.OS !== 'ios' || !ready) return;
    const t = setTimeout(async () => {
      await pulling.current;
      try {
        const { default: widget } = await loadWidget();
        widget.updateTimeline(widgetTimeline(habits, done, shields, today, isPro));
      } catch {
        // Ignore: the widget refreshes from the next successful push.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [ready, habits, done, shields, today, isPro]);

  return null;
}
