/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_LIBRARY, CATEGORIES, PACKS, categoriesFor, packsFor, popular } from './library';
import { ICONS } from './icons';

const iconKeys = new Set(ICONS.map((i) => i.key));

test('every library habit uses a real icon, a schedule, and both languages', () => {
  for (const h of ALL_LIBRARY) {
    assert.ok(iconKeys.has(h.icon), `${h.id} uses unknown icon ${h.icon}`);
    assert.ok(h.days > 0, `${h.id} has no days`);
    for (const lang of ['en', 'sq'] as const) {
      assert.ok(h.name[lang].trim(), `${h.id} has no ${lang} name`);
      assert.ok(h.why[lang].trim(), `${h.id} has no ${lang} reason`);
      assert.ok(h.name[lang].length <= 40, `${h.id} ${lang} name is too long for the name field`);
    }
  }
});

test('ids and names are unique per language', () => {
  assert.equal(new Set(ALL_LIBRARY.map((h) => h.id)).size, ALL_LIBRARY.length);
  for (const lang of ['en', 'sq'] as const) {
    const names = categoriesFor(lang).flatMap((c) => c.habits.map((h) => h.name[lang]));
    assert.equal(new Set(names).size, names.length, `duplicate ${lang} names`);
  }
});

test('Albanian-only content shows only in Albanian', () => {
  assert.ok(categoriesFor('sq').some((c) => c.id === 'ours'));
  assert.ok(!categoriesFor('en').some((c) => c.id === 'ours'));
  assert.ok(packsFor('sq').some((p) => p.id === 'ours'));
  assert.ok(!packsFor('en').some((p) => p.id === 'ours'));
});

test('packs and popular picks', () => {
  assert.ok(PACKS.length >= 7);
  for (const p of PACKS) assert.ok(p.habits.length >= 4, p.id);
  assert.equal(popular('en').length, 8);
  assert.equal(popular('sq').length, 8);
  assert.equal(popular('sq')[1].name, 'Bëj xhiron e mbrëmjes');
  assert.ok(CATEGORIES.length >= 8);
});
