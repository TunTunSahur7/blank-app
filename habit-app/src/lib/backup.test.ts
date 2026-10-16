/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, parseBackup } from './backup';
import type { Habit } from './db';

const habit: Habit = {
  id: 1, name: 'Read', emoji: '📚', color: '#3D7BFF', days: 127,
  reminder: '21:30', createdAt: '2026-10-01', sort: 1,
};

test('round trip', () => {
  const b = buildBackup([habit], [{ habitId: 1, day: '2026-10-02' }]);
  const parsed = parseBackup(JSON.stringify(b));
  assert.deepEqual(parsed.habits, [habit]);
  assert.deepEqual(parsed.checkins, [{ habitId: 1, day: '2026-10-02' }]);
});

test('drops check-ins for unknown habits or bad dates', () => {
  const b = buildBackup([habit], [
    { habitId: 2, day: '2026-10-02' },
    { habitId: 1, day: 'nope' },
    { habitId: 1, day: '2026-10-03' },
  ]);
  assert.deepEqual(parseBackup(JSON.stringify(b)).checkins, [{ habitId: 1, day: '2026-10-03' }]);
});

test('rejects non-backups and newer versions', () => {
  assert.throws(() => parseBackup('not json'), /isn't a Daymark backup/);
  assert.throws(() => parseBackup('{"habits":[]}'), /isn't a Daymark backup/);
  const newer = { ...buildBackup([], []), version: 99 };
  assert.throws(() => parseBackup(JSON.stringify(newer)), /newer version/);
});

test('rejects damaged habits', () => {
  const bad = buildBackup([{ ...habit, days: 999 }], []);
  assert.throws(() => parseBackup(JSON.stringify(bad)), /damaged/);
});
