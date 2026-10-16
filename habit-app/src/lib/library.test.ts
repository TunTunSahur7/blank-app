/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_LIBRARY, CATEGORIES, PACKS, POPULAR } from './library';
import { ICONS } from './icons';

const iconKeys = new Set(ICONS.map((i) => i.key));

test('every library habit uses a real icon and a schedule', () => {
  for (const h of ALL_LIBRARY) {
    assert.ok(iconKeys.has(h.icon), `${h.name} uses unknown icon ${h.icon}`);
    assert.ok(h.days > 0, `${h.name} has no days`);
    assert.ok(h.name.length <= 40, `${h.name} is too long for the name field`);
  }
});

test('habit names are unique', () => {
  const names = ALL_LIBRARY.map((h) => h.name);
  assert.equal(new Set(names).size, names.length);
});

test('packs and popular reference library habits', () => {
  assert.ok(PACKS.length >= 5);
  for (const p of PACKS) assert.ok(p.habits.length >= 4, p.title);
  assert.equal(POPULAR.length, 8);
  assert.ok(CATEGORIES.length >= 6);
});
