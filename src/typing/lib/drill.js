/*
  drill.js — turn a lesson (or a test, or pasted text) into practice items.

    buildLesson(lesson, rng)        -> [{ w, en, ph }]
    buildTimed(content, rng, n)     -> items for a timed test ('words' | 'sentences')
    buildWeak(keystats, rng, n)     -> { keys, items } words rich in the keys you miss most
    buildCustom(text)               -> { items, warnings } from pasted Wylie or Tibetan

  Items are joined with a space when typed: between words a space is a tsheg, after a shad it is
  a space, exactly as in Wylie.
*/
import { entry } from '../data/lexicon.js';
import { CONSONANTS, VOWELS, WORD_POOL, SENTENCES } from '../data/curriculum.js';
import { toWylie, toUnicode, TIBETAN_RE } from '../../foundry/lib/ewts.js';

export function rng32(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Draw `count` items from a pool, reshuffling as it empties and never repeating the last one. */
function bag(pool, count, rng, start = []) {
  const out = start.slice();
  let deck = [];
  while (out.length < count) {
    if (!deck.length) deck = shuffle(pool, rng);
    let next = deck.pop();
    if (pool.length > 1 && next === out[out.length - 1]) {
      deck.unshift(next);
      next = deck.pop();
    }
    out.push(next);
  }
  return out;
}

const ALPHA = CONSONANTS.map(([w]) => w);
const ORDINAL = (n) => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || 'th');
const SANSKRIT = {
  Ta: 'retroflex ṭa', Tha: 'retroflex ṭha', Da: 'retroflex ḍa', Na: 'retroflex ṇa', Sha: 'retroflex ṣa',
  kA: 'ka with long ā', kI: 'ka with long ī', kU: 'ka with long ū', aM: 'a with anusvāra (ṃ)', aH: 'a with visarga (ḥ)',
};

/* A gloss for letter drills: “the 3rd letter”, “ka + gi gu”, “the number 25”. */
export function letterGloss(w) {
  const i = ALPHA.indexOf(w);
  if (i >= 0) return `the ${ORDINAL(i + 1)} letter of the alphabet`;
  if (SANSKRIT[w]) return SANSKRIT[w];
  if (/^\d+$/.test(w)) return `the number ${w}`;
  const m = w.match(/^('?)([a-z']*?)([aiueo])$/);
  if (m) {
    const v = VOWELS.find((x) => x.wy === m[3]);
    const root = m[2] || m[1];
    if (!root && v) return `${v.name} on the a-chen ཨ`;
    if (root === "'" && v) return `${v.name} on the 'a-chung འ`;
    if (root === "'" && m[3] === 'a') return "the 'a-chung";
    if (v) return `${root}a + ${v.name}`;
  }
  return '';
}

function item(w) {
  const e = entry(w);
  return e.en ? e : { w, en: letterGloss(w), ph: '' };
}

/* In the alphabet and vowel drills, ka is the first letter, not a word (nga is “I”, but not here). */
const letterItem = (w) => ({ w, en: letterGloss(w), ph: '' });

export function buildLesson(lesson, rng = rng32()) {
  const d = lesson.drill;
  if (d.kind === 'sentences') return d.items.map(([w, en]) => ({ w, en, ph: '' }));
  const mk = d.items.every((w) => letterGloss(w)) ? letterItem : item;
  if (d.kind === 'words') return bag(d.items, d.count, rng).map(mk);
  if (d.kind === 'sequence') {
    const out = d.items.slice();
    while (out.length < d.count) out.push(...(d.ordered ? d.items : shuffle(d.items, rng)));
    return out.slice(0, d.count).map(mk);
  }
  // letters: the new letters once in order, then a mix weighted 70/30 toward them
  const review = d.review || [];
  const out = d.items.slice();
  while (out.length < d.count) {
    const pool = review.length && rng() < 0.3 ? review : d.items;
    let next = pick(pool, rng);
    if (next === out[out.length - 1]) next = pick(pool, rng);
    out.push(next);
  }
  return out.map(mk);
}

export function buildTimed(content, rng = rng32(), n = 400) {
  if (content === 'sentences') {
    const uniq = [...new Map(SENTENCES.map((s) => [s[0], s])).values()];
    const out = [];
    while (out.length < n / 4) out.push(...shuffle(uniq, rng));
    return out.map(([w, en]) => ({ w, en, ph: '' }));
  }
  return bag(WORD_POOL, n, rng).map(item);
}

/* keystats: { [char]: [attempts, misses] } */
export function weakKeys(keystats, max = 4) {
  return Object.entries(keystats || {})
    .filter(([ch, [n]]) => ch !== ' ' && n >= 8)
    .map(([ch, [n, miss]]) => ({ ch, n, miss, rate: (miss + 0.5) / (n + 4) }))
    .filter((k) => k.miss > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, max);
}

export function buildWeak(keystats, rng = rng32(), n = 24) {
  const keys = weakKeys(keystats);
  if (!keys.length) return { keys, items: [] };
  const chars = keys.map((k) => k.ch);
  const scored = WORD_POOL.map((w) => ({ w, s: chars.reduce((acc, ch) => acc + w.split(ch).length - 1, 0) })).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  const pool = scored.slice(0, Math.max(12, Math.ceil(scored.length / 3))).map((x) => x.w);
  return { keys, items: bag(pool, n, rng).map(item) };
}

/* Pasted text: Tibetan is converted to Wylie; lines and sentences become items. */
export function buildCustom(raw) {
  let text = String(raw || '').replace(/\r/g, '').trim();
  if (!text) return { items: [], warnings: [], wylie: '' };
  // pasted Tibetan: practise the Tibetan only (English notes and numbering in Latin are dropped)
  if (TIBETAN_RE.test(text)) text = toWylie(text.replace(/[^\u0F00-\u0FFF\s]+/g, ' ')).text;
  text = text
    .replace(/[’‘ʼ`´]/g, "'")
    .replace(/_/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n+ */g, '\n')
    .trim();
  const chunks = text
    .split('\n')
    .flatMap((line) => line.split(/(?<=\/+) (?=\S)/))
    .map((s) => s.trim())
    .filter(Boolean);
  const warnings = [];
  for (const c of chunks) {
    for (const syl of c.split(/[ /]+/).filter(Boolean)) {
      const r = toUnicode(syl);
      if (r.warnings.length) warnings.push(syl);
    }
  }
  return { items: chunks.slice(0, 400).map((w) => ({ w, en: '', ph: '' })), warnings: [...new Set(warnings)], wylie: chunks.join(' ') };
}
