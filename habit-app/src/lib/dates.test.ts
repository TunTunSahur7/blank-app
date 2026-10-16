/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DAYS,
  addDays,
  bestStreak,
  completionRate,
  currentStreak,
  describeDays,
  isValidKey,
  previousScheduled,
  rescuable,
  weekdayOf,
} from './dates';

// 2026-10-16 is a Friday.
const TODAY = '2026-10-16';
const set = (...keys: string[]) => new Set(keys);
const WEEKDAYS = 0b0111110;

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});

test('weekdayOf', () => {
  assert.equal(weekdayOf(TODAY), 5);
});

test('current streak counts back from today', () => {
  assert.equal(currentStreak(set('2026-10-14', '2026-10-15', TODAY), ALL_DAYS, TODAY), 3);
});

test('unfinished today does not break the streak', () => {
  assert.equal(currentStreak(set('2026-10-14', '2026-10-15'), ALL_DAYS, TODAY), 2);
});

test('missing yesterday breaks the streak', () => {
  assert.equal(currentStreak(set('2026-10-13', '2026-10-14'), ALL_DAYS, TODAY), 0);
});

test('unscheduled days are skipped, not counted as misses', () => {
  // Weekdays only: Fri 9th, Mon 12th..Thu 15th done; the weekend gap is fine.
  const done = set('2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15');
  assert.equal(currentStreak(done, WEEKDAYS, TODAY), 5);
});

test('best streak finds the longest run', () => {
  const done = set('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-10', TODAY);
  assert.equal(bestStreak(done, ALL_DAYS, TODAY), 4);
});

test('empty history', () => {
  assert.equal(currentStreak(set(), ALL_DAYS, TODAY), 0);
  assert.equal(bestStreak(set(), ALL_DAYS, TODAY), 0);
});

test('completion rate only counts scheduled days', () => {
  // Mon 12 .. Sun 18 has 5 weekdays; we only go to Fri 16 => Mon..Fri = 5, 3 done.
  const done = set('2026-10-12', '2026-10-13', '2026-10-17');
  assert.equal(completionRate(done, WEEKDAYS, '2026-10-12', TODAY), 2 / 5);
});

test('describeDays', () => {
  assert.equal(describeDays(ALL_DAYS), 'Every day');
  assert.equal(describeDays(WEEKDAYS), 'Weekdays');
  assert.equal(describeDays(0b0000110), 'Mon, Tue');
});

test('isValidKey rejects impossible dates', () => {
  assert.equal(isValidKey('2026-10-16'), true);
  assert.equal(isValidKey('2026-02-30'), false);
  assert.equal(isValidKey('16/10/2026'), false);
});

test('a shield keeps the streak alive across a missed day', () => {
  const done = set('2026-10-12', '2026-10-13', '2026-10-15', TODAY);
  assert.equal(currentStreak(done, ALL_DAYS, TODAY), 2);
  assert.equal(currentStreak(done, ALL_DAYS, TODAY, set('2026-10-14')), 4);
  assert.equal(bestStreak(done, ALL_DAYS, TODAY, set('2026-10-14')), 4);
});

test('rescuable finds a streak that broke yesterday', () => {
  const done = set('2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14');
  assert.deepEqual(rescuable(done, ALL_DAYS, TODAY), { day: '2026-10-15', streak: 4 });
  // Already shielded, or streak too short to be worth saving.
  assert.equal(rescuable(done, ALL_DAYS, TODAY, set('2026-10-15')), null);
  assert.equal(rescuable(set('2026-10-14'), ALL_DAYS, TODAY), null);
  // Nothing to rescue when yesterday was done.
  assert.equal(rescuable(set('2026-10-13', '2026-10-14', '2026-10-15'), ALL_DAYS, TODAY), null);
});

test('rescuable respects schedules', () => {
  // Weekdays: Mon 12, Tue 13, Wed 14 done, Thu 15 missed.
  const done = set('2026-10-12', '2026-10-13', '2026-10-14');
  assert.deepEqual(rescuable(done, WEEKDAYS, TODAY), { day: '2026-10-15', streak: 3 });
  assert.equal(previousScheduled(WEEKDAYS, '2026-10-12'), '2026-10-09');
});
