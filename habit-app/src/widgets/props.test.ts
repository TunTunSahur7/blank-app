/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Habit } from '../lib/db';
import { editsFrom, widgetPropsFor, widgetTimeline } from './props';

const habit = (id: number, name: string, days = 127): Habit => ({
  id, name, icon: 'water', color: '#007AFF', days, reminder: null, createdAt: '2026-10-01', sort: id,
});
const habits = [habit(1, 'Water'), habit(2, 'Read'), habit(3, 'Gym', 0b0101010)];
const done = new Map<number, Set<string>>([
  [1, new Set(['2026-10-14', '2026-10-15', '2026-10-16'])],
  [2, new Set(['2026-10-15'])],
  [3, new Set()],
]);
const shields = new Map<number, Set<string>>();

test('props show scheduled habits, open ones first, with streaks', () => {
  // 2026-10-16 is a Friday: Gym (Mon/Wed/Fri) is due.
  const p = widgetPropsFor(habits, done, shields, '2026-10-16', true);
  assert.equal(p.weekday, 'Friday');
  assert.deepEqual(p.habits.map((h) => [h.name, h.done]), [['Read', false], ['Gym', false], ['Water', true]]);
  assert.equal(p.habits.find((h) => h.name === 'Water')!.streak, 3);
  assert.equal(p.habits[0].sf, 'drop.fill');
  assert.equal(p.topStreak, 3);
});

test('timeline rolls over at midnight', () => {
  const t = widgetTimeline(habits, done, shields, '2026-10-16', false);
  assert.equal(t.length, 3);
  assert.equal(t[1].props.day, '2026-10-17');
  assert.equal(t[1].date.getHours(), 0);
  assert.equal(t[1].date.getDate(), 17);
  // Saturday: Gym is not scheduled.
  assert.deepEqual(t[1].props.habits.map((h) => h.name).sort(), ['Read', 'Water']);
  assert.ok(t[1].props.habits.every((h) => !h.done));
});

test('edits made on the widget become exact check-in states', () => {
  const edits = editsFrom([
    { props: { day: '2026-10-16', edits: { '2': true, '1': false } } },
    { props: { day: '2026-10-17', edits: {} } },
    { props: { day: '2026-10-16', edits: { '2': false, bad: true } as Record<string, boolean> } },
  ]);
  // Later entries win; order doesn't matter.
  assert.deepEqual(
    [...edits].sort((a, b) => a.habitId - b.habitId),
    [
      { habitId: 1, day: '2026-10-16', done: false },
      { habitId: 2, day: '2026-10-16', done: false },
    ],
  );
});
