import { Button, Gauge, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background, buttonStyle, containerBackground, font, foregroundStyle, frame, gaugeStyle, lineLimit, padding, shapes,
  tint, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'expo-symbols';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type WidgetHabit = { id: number; name: string; sf: SFSymbol; color: string; done: boolean; streak: number };

export type TodayWidgetProps = {
  /** The day this entry shows, 'YYYY-MM-DD'. */
  day: string;
  weekday: string;
  habits: WidgetHabit[];
  topStreak: number;
  pro: boolean;
  /** Check-offs made on the widget itself, habitId -> done; the app applies and clears them. */
  edits: Record<string, boolean>;
  /** Localized labels; {n}, {d} and {t} are filled in by the widget. */
  l?: WidgetLabels;
};

export type WidgetLabels = {
  today: string;
  doneToday: string;
  allDoneToday: string;
  allDone: string;
  nothing: string;
  rest: string;
  startStreak: string;
  checkOffPro: string;
  /** '+{n} more' */
  more: string;
  /** '{d} of {t} habits done' */
  habitsDone: string;
  /** '{d} of {t} done' */
  doneOf: string;
  /** '{n}-day streak' */
  streak: string;
};

/**
 * Home Screen and Lock Screen widget. This function is compiled into a string and runs inside
 * the widget, so it may only use its arguments and the SwiftUI globals imported above —
 * no other module-level values, and plain JS without helpers babel would inject.
 */
const TodayWidget = (props: TodayWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const bg = dark ? '#1C1C1E' : '#FFFFFF';
  const fg = dark ? '#F5F5F7' : '#1D1D1F';
  const muted = dark ? '#A1A1A6' : '#6E6E73';
  const accent = dark ? '#2997FF' : '#0071E3';
  const l = props.l || {
    today: 'Today', doneToday: 'done today', allDoneToday: 'all done today', allDone: 'All done today',
    nothing: 'nothing scheduled', rest: 'Rest', startStreak: 'Start a streak today', checkOffPro: 'Check off from here with Pro',
    more: '+{n} more', habitsDone: '{d} of {t} habits done', doneOf: '{d} of {t} done', streak: '{n}-day streak',
  };
  const habits = props.habits || [];
  const total = habits.length;
  const done = habits.filter(function (h) { return h.done; }).length;
  const progress = total ? done / total : 0;
  const family = env.widgetFamily || 'systemSmall';
  const streakText = props.topStreak > 1 ? l.streak.replace('{n}', String(props.topStreak)) : l.startStreak;
  const allDone = total > 0 && done === total;
  const doneOf = l.doneOf.replace('{d}', String(done)).replace('{t}', String(total));

  function toggle(id: number) {
    return function () {
      const edits: Record<string, boolean> = Object.assign({}, props.edits || {});
      const next = habits.map(function (h) {
        if (h.id !== id) return h;
        edits[String(id)] = !h.done;
        return Object.assign({}, h, { done: !h.done });
      });
      return { habits: next, edits: edits };
    };
  }

  if (family === 'accessoryInline') {
    return <Text>{total ? l.habitsDone.replace('{d}', String(done)).replace('{t}', String(total)) : 'Besa'}</Text>;
  }

  if (family === 'accessoryCircular') {
    return (
      <Gauge value={progress} modifiers={[gaugeStyle('circularCapacity')]} currentValueLabel={<Text>{String(done)}</Text>}>
        <Image systemName="checkmark" />
      </Gauge>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>Besa</Text>
        <Text modifiers={[font({ size: 17, weight: 'bold', design: 'rounded' })]}>
          {allDone ? l.allDone : doneOf}
        </Text>
        <Text modifiers={[font({ size: 13 }), lineLimit(1)]}>{streakText}</Text>
      </VStack>
    );
  }

  const ring = (
    <Gauge
      value={progress}
      modifiers={[gaugeStyle('circularCapacity'), tint(accent)]}
      currentValueLabel={<Text modifiers={[font({ size: 14, weight: 'bold', design: 'rounded' })]}>{String(done)}</Text>}
    >
      <Text>{''}</Text>
    </Gauge>
  );

  if (family === 'systemSmall' || total === 0) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[containerBackground(bg, 'widget'), widgetURL('besa://')]}>
        <HStack>
          {ring}
          <Spacer />
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(muted)]}>{props.weekday}</Text>
        </HStack>
        <Spacer />
        <Text modifiers={[font({ size: 30, weight: 'bold', design: 'rounded' }), foregroundStyle(fg)]}>
          {total ? done + '/' + total : l.rest}
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>{total ? (allDone ? l.allDoneToday : l.doneToday) : l.nothing}</Text>
        <HStack spacing={4}>
          <Image systemName="flame.fill" size={12} color="#FF9500" />
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(fg), lineLimit(1)]}>{streakText}</Text>
        </HStack>
      </VStack>
    );
  }

  const large = family === 'systemLarge' || family === 'systemExtraLarge';
  const rows = habits.slice(0, large ? 8 : 4);

  const list = (
    <VStack alignment="leading" spacing={large ? 9 : 6}>
      {rows.map(function (h) {
        const row = (
          <HStack spacing={9}>
            <Image
              systemName={h.sf}
              size={12}
              color="#FFFFFF"
              modifiers={[frame({ width: 24, height: 24 }), background(h.color, shapes.roundedRectangle({ cornerRadius: 7 }))]}
            />
            <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(h.done ? muted : fg), lineLimit(1)]}>{h.name}</Text>
            <Spacer />
            <Image systemName={h.done ? 'checkmark.circle.fill' : 'circle'} size={20} color={h.done ? h.color : muted} />
          </HStack>
        );
        return props.pro ? (
          <Button key={'h' + h.id} target={'h' + h.id} onPress={toggle(h.id)} modifiers={[buttonStyle('plain')]}>
            {row}
          </Button>
        ) : (
          <VStack key={'h' + h.id}>{row}</VStack>
        );
      })}
      {habits.length > rows.length ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>{l.more.replace('{n}', String(habits.length - rows.length))}</Text>
      ) : null}
      {props.pro ? null : (
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(accent)]}>{l.checkOffPro}</Text>
      )}
    </VStack>
  );

  const link = props.pro ? 'besa://' : 'besa://paywall?from=widget';

  if (large) {
    return (
      <VStack alignment="leading" spacing={12} modifiers={[containerBackground(bg, 'widget'), widgetURL(link)]}>
        <HStack spacing={10}>
          {ring}
          <VStack alignment="leading" spacing={0}>
            <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(fg)]}>{l.today}</Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>{doneOf + ' · ' + streakText}</Text>
          </VStack>
          <Spacer />
        </HStack>
        {list}
        <Spacer />
      </VStack>
    );
  }

  return (
    <HStack spacing={14} modifiers={[containerBackground(bg, 'widget'), widgetURL(link)]}>
      <VStack alignment="leading" spacing={2} modifiers={[frame({ width: 92 })]}>
        {ring}
        <Spacer />
        <Text modifiers={[font({ size: 26, weight: 'bold', design: 'rounded' }), foregroundStyle(fg)]}>{done + '/' + total}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted), lineLimit(1)]}>{props.weekday}</Text>
      </VStack>
      <VStack modifiers={[padding({ top: 2 })]}>
        {list}
        <Spacer />
      </VStack>
    </HStack>
  );
};

export default createWidget<TodayWidgetProps>('BesaToday', TodayWidget, {
  day: '',
  weekday: '',
  habits: [],
  topStreak: 0,
  pro: false,
  edits: {},
});
