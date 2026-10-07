/* Run: npm run test:spell — spell() step lists and the scheme file. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spell, unitsFor } from '../spell.js';
import { parseSyllable } from '../../typing/lib/anatomy.js';
import { ANATOMY_EXAMPLES, WORD_POOL } from '../../typing/data/curriculum.js';

const scheme = JSON.parse(readFileSync(new URL('../utsang.json', import.meta.url), 'utf8'));
const run = (wy) => spell(parseSyllable(wy), scheme);
const said = (wy) => run(wy).steps.map((s) => s.say.join('+'));
const shape = (wy) => run(wy).steps.map((s) => `${s.say.join('+')}@${s.highlight.join(',')}/${s.show}`);

test('ki: ka, gi-gu, ki', () => {
  assert.deepEqual(shape('ki'), ['l.ka@0/1', 'v.gigu@1/2', 'syl.ki@0,1/2']);
  assert.deepEqual(run('ki').steps.map((s) => s.label), ['ka', 'gi-gu', 'ki']);
  assert.equal(run('ki').steps.at(-1).final, true);
});

test('bkra: prefix, root, ra-btags, then the fused stack', () => {
  assert.deepEqual(shape('bkra'), ['pre.ba@0/1', 'l.ka@1/2', 'sub.ra@2/3', 'syl.bkra@0,1,2/3']);
  assert.deepEqual(run('bkra').steps.map((s) => s.label), ['ba-o', 'ka', 'ra-ta', 'bkra']);
});

test('sgrub and bsgrubs', () => {
  assert.deepEqual(said('sgrub'), ['sup.sa', 'l.ga', 'sub.ra', 'syl.sgra', 'v.zhabkyu', 'syl.sgru', 'l.ba', 'syl.sgrub']);
  assert.deepEqual(run('sgrub').steps.map((s) => s.show), [1, 2, 3, 3, 4, 4, 5, 5]);
  assert.deepEqual(said('bsgrubs'), [
    'pre.ba', 'sup.sa', 'l.ga', 'sub.ra', 'syl.bsgra', 'v.zhabkyu', 'syl.bsgru', 'l.ba', 'syl.bsgrub', 'l.sa', 'syl.bsgrubs',
  ]);
});

test('short shapes: a bare letter is said once, the inherent a is not named', () => {
  assert.deepEqual(said('ka'), ['l.ka']);
  assert.deepEqual(said('kag'), ['l.ka', 'l.ga', 'syl.kag']);
  assert.deepEqual(said('rka'), ['sup.ra', 'l.ka', 'syl.rka']);
  assert.deepEqual(said('grwa'), ['l.ga', 'sub.ra', 'sub.wa', 'syl.grwa']);
  assert.deepEqual(said('brgyad'), ['pre.ba', 'sup.ra', 'l.ga', 'sub.ya', 'syl.brgya', 'l.da', 'syl.brgyad']);
  assert.deepEqual(said('i'), ['l.a', 'v.gigu', 'syl.i']);
});

test('the genitive, two vowels, g.y, and prefixes before ta and before a ra-btags stack', () => {
  assert.deepEqual(said("pa'i"), ['l.pa', "l.'a", "syl.pa'", 'v.gigu', "syl.pa'i"]);
  assert.deepEqual(said("spre'u"), ['sup.sa', 'l.pa', 'sub.ra', 'syl.spra', 'v.drengbu', 'syl.spre', "l.'a", "syl.spre'", 'v.zhabkyu', "syl.spre'u"]);
  assert.deepEqual(said('g.yag'), ['pre.ga', 'l.ya', 'syl.g.ya', 'l.ga', 'syl.g.yag']);
  assert.deepEqual(said("'bras"), ["pre.'a", 'l.ba', 'sub.ra', "syl.'bra", 'l.sa', "syl.'bras"]);
  assert.deepEqual(said('gtam'), ['pre.ga', 'l.ta', 'syl.gta', 'l.ma', 'syl.gtam']);
});

test('every course syllable spells: known units, the stack only grows, the Tibetan matches', () => {
  const syls = [...new Set([...ANATOMY_EXAMPLES, ...WORD_POOL].flatMap((w) => w.split(/[\s/]+/)).filter(Boolean))];
  let spelled = 0;
  for (const wy of syls) {
    const p = parseSyllable(wy);
    if (!p.ok) continue;
    const r = spell(p, scheme);
    assert.ok(r.ok, wy);
    spelled++;
    let shown = 0;
    for (const s of r.steps) {
      for (const id of s.say) assert.ok(scheme.units[id] || id.startsWith(scheme.result_unit), `${wy}: unknown unit ${id}`);
      assert.ok(s.show >= shown, `${wy}: the stack shrank`);
      shown = s.show;
      for (const i of s.highlight) assert.ok(i < s.show, `${wy}: highlight off screen`);
      if (s.kind === 'result') assert.equal(s.tib, [...p.bo].slice(0, s.show).join(''), `${wy}: ${s.label}`);
    }
    assert.equal(r.steps.at(-1).show, [...p.bo].length, `${wy}: stops short`);
  }
  assert.ok(spelled > 150, `only ${spelled} syllables spelled`);
});

test('the examples need only a handful of recordings', () => {
  const units = unitsFor(ANATOMY_EXAMPLES.map(parseSyllable), scheme);
  assert.ok(units.length <= 40, `${units.length} units`);
  for (const u of units) assert.ok(u.label && u.tib, u.id);
});

test('the scheme: every table entry is a unit, every unit is in a table', () => {
  const used = new Set();
  for (const table of Object.values(scheme.tables)) {
    for (const id of Object.values(table)) {
      assert.ok(scheme.units[id], id);
      used.add(id);
    }
  }
  for (const [id, u] of Object.entries(scheme.units)) {
    assert.ok(used.has(id), `unit ${id} is in no table`);
    assert.ok(u.tib && u.say, id);
    assert.match(id, /^[a-z]+\.[a-z'.]+$/, id);
  }
  assert.equal(Object.keys(scheme.tables.letters).length, 30);
});
