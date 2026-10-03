/* Run: node --test src/typing/tests/   (also `npm run test:typing`, and a step in the deploy workflow) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toUnicode } from '../../foundry/lib/ewts.js';
import { LEXICON } from '../data/lexicon.js';
import { UNITS, LESSONS, WORD_POOL, SENTENCES, ANATOMY_EXAMPLES, CONSONANTS } from '../data/curriculum.js';
import { parseSyllable, tokenAt } from '../lib/anatomy.js';
import { buildLesson, buildTimed, buildWeak, buildCustom, rng32, letterGloss } from '../lib/drill.js';
import { Session, buildCells, sepToBo, starsFor } from '../lib/session.js';

const syllables = (w) => w.split(/[\s/]+/).filter(Boolean);
const roles = (w) => parseSyllable(w).parts.map((p) => `${p.role}:${p.wy}`).join(' ');

test('every lexicon word converts without a warning and has a gloss', () => {
  for (const { w, en, ph } of LEXICON.values()) {
    assert.ok(en, `${w} has no gloss`);
    assert.ok(ph, `${w} has no pronunciation`);
    for (const s of syllables(w)) assert.deepEqual(toUnicode(s).warnings, [], `${w}: ${s}`);
  }
});

test('the alphabet table matches the converter', () => {
  for (const [w, bo] of CONSONANTS) assert.equal(toUnicode(w).text, bo, w);
  assert.equal(CONSONANTS.length, 30);
});

test('every lesson builds, and every syllable it can produce is valid Wylie', () => {
  assert.equal(UNITS.length, 10);
  assert.equal(LESSONS.length, 55);
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), `duplicate lesson ${l.id}`);
    ids.add(l.id);
    const items = l.drill.kind === 'sentences' ? l.drill.items.map((x) => x[0]) : l.drill.items;
    for (const it of items) {
      for (const s of syllables(it)) assert.deepEqual(toUnicode(s).warnings, [], `${l.id}: ${it}`);
      if (l.drill.kind === 'words') assert.ok(LEXICON.has(it), `${l.id}: ${it} is not in the lexicon`);
    }
    const built = buildLesson(l, rng32(7));
    assert.ok(built.length > 0, l.id);
    if (l.drill.count) assert.equal(built.length, l.drill.count, l.id);
    for (const b of built) assert.ok(b.en, `${l.id}: ${b.w} has no gloss`);
  }
});

test('the anatomy of every native word is rebuilt exactly from its parts', () => {
  let n = 0;
  for (const w of [...WORD_POOL, ...SENTENCES.flatMap(([s]) => syllables(s))]) {
    for (const s of syllables(w)) {
      const p = parseSyllable(s);
      assert.ok(p.ok, `${s}: ${p.reason}`);
      n++;
    }
  }
  assert.ok(n > 400);
  for (const w of ANATOMY_EXAMPLES) assert.ok(parseSyllable(w).ok, w);
});

test('anatomy assigns the textbook roles', () => {
  assert.equal(roles('brgyad'), 'prefix:b super:r root:g sub:y vowel:a suffix:d');
  assert.equal(roles('bsgrubs'), 'prefix:b super:s root:g sub:r vowel:u suffix:b post:s');
  assert.equal(roles('g.yag'), 'prefix:g root:y vowel:a suffix:g');
  assert.equal(roles('gyon'), 'root:g sub:y vowel:o suffix:n');
  assert.equal(roles('rlung'), 'root:r sub:l vowel:u suffix:ng');
  assert.equal(roles('lho'), 'super:l root:h vowel:o');
  assert.equal(roles('grwa'), 'root:g sub:r sub2:w vowel:a');
  assert.equal(roles('rtswa'), 'super:r root:ts sub:w vowel:a');
  assert.equal(roles("nga'i"), "root:ng vowel:a achung:' avowel:i");
  assert.equal(roles("spre'u"), "super:s root:p sub:r vowel:e achung:' avowel:u");
  assert.equal(roles("dga'"), "prefix:d root:g vowel:a suffix:'");
  assert.equal(roles("'o"), "root:' vowel:o");
  assert.equal(roles('o'), 'root: vowel:o');
  assert.equal(roles('dbyangs'), 'prefix:d root:b sub:y vowel:a suffix:ng post:s');
  assert.equal(parseSyllable('pad+ma').ok, false);
  assert.equal(parseSyllable('Ta').ok, false);
  assert.equal(parseSyllable('xyz').ok, false);
  assert.deepEqual(tokenAt('tshwa', 1), { t: 'c', wy: 'tsh', start: 0, end: 3 });
});

test('separators become tsheg, shad and space', () => {
  assert.equal(sepToBo(' '), '་');
  assert.equal(sepToBo('/'), '།');
  assert.equal(sepToBo('/ '), '། ');
  assert.equal(sepToBo(' /'), '་།');
  assert.equal(sepToBo('//'), '༎');
  assert.equal(sepToBo(''), '');
});

test('cells: one per syllable, with the keys that follow it', () => {
  const cells = buildCells([{ w: 'bkra shis bde legs/' }, { w: 'nga yong /' }, { w: 'brgyad' }]);
  assert.deepEqual(
    cells.map((c) => c.bo + c.punct),
    ['བཀྲ་', 'ཤིས་', 'བདེ་', 'ལེགས། ', 'ང་', 'ཡོང་། ', 'བརྒྱད'],
  );
  const text = 'bkra shis bde legs/ nga yong / brgyad';
  assert.equal(cells.at(-1).end, text.length);
  for (const c of cells) assert.equal(text.slice(c.start, c.sylEnd), c.wy);
});

test('a session waits for the right key and measures speed and accuracy', () => {
  const s = new Session([{ w: 'ka' }, { w: 'kha' }]);
  assert.equal(s.text, 'ka kha');
  let t = 1000;
  assert.equal(s.type('k', t).ok, true);
  assert.equal(s.type('x', (t += 100)).ok, false);
  assert.equal(s.expected, 'a');
  assert.equal(s.type('x', (t += 100)).ok, false); // a second miss at the same place
  for (const ch of 'a kha') s.type(ch, (t += 200));
  assert.equal(s.done, true);
  const st = s.stats(t);
  assert.equal(st.correct, 6);
  assert.equal(st.errors, 2);
  assert.equal(st.accuracy, 6 / 8);
  assert.equal(st.syllables, 2);
  assert.ok(st.wpm > 0);
  assert.deepEqual(s.keys.a, [2, 1]); // 'a' twice: one miss, however many wrong presses
  assert.deepEqual(s.problemKeys(), [{ ch: 'a', attempts: 2, misses: 1 }]);
  assert.equal(s.problemWords()[0].w, 'ka');
  // standard WPM: 6 correct keys = 1.2 words over the elapsed minutes
  assert.ok(Math.abs(st.wpm - 1.2 / (st.ms / 60000)) < 1e-9);
});

test('a timed session stops at the limit', () => {
  const s = new Session(buildTimed('words', rng32(1)), { seconds: 60 });
  s.type(s.expected, 0 + 1);
  assert.equal(s.tick(30000), false);
  assert.equal(s.tick(61001), true);
  assert.equal(s.done, true);
  assert.equal(s.stats(90000).ms, 60000);
});

test('pausing stops the clock', () => {
  const s = new Session([{ w: 'ka kha' }]);
  s.type('k', 1000);
  s.pause(2000);
  assert.equal(s.elapsed(9000), 1000);
  s.type('a', 12000); // typing resumes the clock
  assert.equal(s.elapsed(12000), 1000);
  assert.equal(s.elapsed(13000), 2000);
});

test('stars', () => {
  assert.equal(starsFor({ accuracy: 0.99, wpm: 20 }, 16), 3);
  assert.equal(starsFor({ accuracy: 0.99, wpm: 10 }, 16), 2);
  assert.equal(starsFor({ accuracy: 0.9, wpm: 40 }, 16), 1);
});

test('timed, weak-key and custom drills', () => {
  assert.equal(buildTimed('words', rng32(3), 100).length, 100);
  assert.ok(buildTimed('sentences', rng32(3), 100).length >= 25);
  assert.deepEqual(buildWeak({}, rng32(1)).items, []);
  const weak = buildWeak({ g: [40, 12], ' ': [100, 50], k: [30, 1] }, rng32(2));
  assert.equal(weak.keys[0].ch, 'g');
  assert.ok(weak.items.every((i) => i.w.includes('g') || i.w.includes('k')));
  const custom = buildCustom('བཀྲ་ཤིས་བདེ་ལེགས། ཐུགས་རྗེ་ཆེ།');
  assert.deepEqual(custom.items.map((i) => i.w), ['bkra shis bde legs/', 'thugs rje che/']);
  assert.deepEqual(custom.warnings, []);
  assert.deepEqual(buildCustom('nga  yin/\n\nkho  yin/').items.map((i) => i.w), ['nga yin/', 'kho yin/']);
  assert.ok(buildCustom('bkra xyz').warnings.includes('xyz'));
});

test('letter glosses', () => {
  assert.equal(letterGloss('ka'), 'the 1st letter of the alphabet');
  assert.equal(letterGloss('a'), 'the 30th letter of the alphabet');
  assert.equal(letterGloss('khi'), 'kha + gi gu');
  assert.equal(letterGloss('o'), 'na ro on the a-chen ཨ');
  assert.equal(letterGloss("'u"), "zhabs kyu on the 'a-chung འ");
  assert.equal(letterGloss('25'), 'the number 25');
});
