/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeDays } from './dates';
import { formatLongDate, formatTime, setLanguage, strings } from './i18n';
import { widgetPropsFor } from '../widgets/props';

const sq = strings('sq');
const en = strings('en');

test('Albanian dates and 24-hour times', () => {
  const d = new Date(2026, 9, 16);
  assert.equal(formatLongDate(d, sq), 'E premte, 16 tetor');
  assert.equal(formatLongDate(d, en), 'Friday, October 16');
  assert.equal(formatTime('20:00', sq), '20:00');
  assert.equal(formatTime('20:00', en), '8:00 PM');
  assert.equal(formatTime('09:05', sq), '09:05');
});

test('schedules read naturally in Albanian', () => {
  assert.equal(describeDays(127, sq), 'Çdo ditë');
  assert.equal(describeDays(0b0111110, sq), 'Ditët e punës');
  assert.equal(describeDays(0b0000110, sq), 'Hën, Mar');
});

test('the widget gets its labels in the current language', () => {
  const habits = [{ id: 1, name: 'Pi 8 gota ujë', icon: 'water', color: '#007AFF', days: 127, reminder: null, createdAt: '2026-10-01', sort: 1 }];
  setLanguage('sq');
  const p = widgetPropsFor(habits, new Map([[1, new Set(['2026-10-15'])]]), new Map(), '2026-10-16', false);
  assert.equal(p.weekday, 'E premte');
  assert.equal(p.l?.streak, '{n} ditë rresht');
  assert.equal(p.l?.doneOf, '{d} nga {t} të kryera');
  assert.equal(p.l?.habitsDone, '{d} nga {t} shprehi të kryera');
  assert.equal(p.l?.more, '+{n} të tjera');
  setLanguage('en');
  const e = widgetPropsFor(habits, new Map(), new Map(), '2026-10-16', false);
  assert.equal(e.l?.streak, '{n}-day streak');
  assert.equal(e.l?.doneOf, '{d} of {t} done');
});
