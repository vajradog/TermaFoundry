/*
  anatomy.js — take one Wylie syllable apart.

    parseSyllable('brgyad') -> {
      ok: true, wy, bo: 'བརྒྱད',
      parts: [ { role: 'prefix', wy: 'b', bo: 'བ', start: 0, end: 1, label, term, detail }, ... ]
    }

  Roles, in writing order: prefix, super, root, sub, sub2 (a second subscript: wa-zur under
  ya/ra-btags), vowel, suffix, post, achung + avowel (an 'a-chung carrying a vowel: nga'i, spre'u).

  The parse is checked against the converter: the parts are rebuilt into Unicode and must give
  exactly what the converter gives for the whole syllable, so the diagram never disagrees with
  the script. Sanskrit (capitals, +) and figures are not analysed.
*/
import { toUnicode } from '../../foundry/lib/ewts.js';

const CONS = ['tsh', 'ts', 'dz', 'kh', 'ng', 'ch', 'ny', 'th', 'ph', 'zh', 'sh', 'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'b', 'm', 'w', 'z', "'", 'y', 'r', 'l', 's', 'h'];

export const BASE = {
  k: 'ཀ', kh: 'ཁ', g: 'ག', ng: 'ང', c: 'ཅ', ch: 'ཆ', j: 'ཇ', ny: 'ཉ', t: 'ཏ', th: 'ཐ', d: 'ད', n: 'ན',
  p: 'པ', ph: 'ཕ', b: 'བ', m: 'མ', ts: 'ཙ', tsh: 'ཚ', dz: 'ཛ', w: 'ཝ', zh: 'ཞ', z: 'ཟ', "'": 'འ', y: 'ཡ',
  r: 'ར', l: 'ལ', sh: 'ཤ', s: 'ས', h: 'ཧ', a: 'ཨ',
};
/* Subjoined forms sit 0x50 above the base letters (ཀ U+0F40 -> ྐ U+0F90; ཝ -> wa-zur ྭ U+0FAD). */
const SUBJ = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, String.fromCodePoint(v.codePointAt(0) + 0x50)]));
export const VOWEL_SIGN = { a: '', i: 'ི', u: 'ུ', e: 'ེ', o: 'ོ' };
export const VOWEL_NAME = { a: 'inherent a', i: 'gi gu', u: 'zhabs kyu', e: "'greng bu", o: 'na ro' };

const PREFIX = new Set(['g', 'd', 'b', 'm', "'"]);
const SUPER = {
  r: new Set(['k', 'g', 'ng', 'j', 'ny', 't', 'd', 'n', 'b', 'm', 'ts', 'dz']),
  l: new Set(['k', 'g', 'ng', 'c', 'j', 't', 'd', 'p', 'b', 'h']),
  s: new Set(['k', 'g', 'ng', 'ny', 't', 'd', 'n', 'p', 'b', 'm', 'ts']),
};
const SUB = {
  y: new Set(['k', 'kh', 'g', 'p', 'ph', 'b', 'm']),
  r: new Set(['k', 'kh', 'g', 't', 'th', 'd', 'n', 'p', 'ph', 'b', 'm', 's', 'h']),
  l: new Set(['k', 'g', 'b', 'z', 'r', 's']),
  w: null, // wa-zur: checked by the converter
};
const SUFFIX = new Set(['g', 'ng', 'd', 'n', 'b', 'm', "'", 'r', 'l', 's']);
const POST = new Set(['s', 'd']);

const SUPER_NAME = { r: 'ra-mgo', l: 'la-mgo', s: 'sa-mgo' };
const SUB_NAME = { y: 'ya-btags', r: 'ra-btags', l: 'la-btags', w: 'wa-zur' };

export const ROLE_INFO = {
  prefix: { label: 'Prefix', term: "sngon 'jug" },
  super: { label: 'Superscript', term: 'mgo' },
  root: { label: 'Root', term: 'ming gzhi' },
  sub: { label: 'Subscript', term: 'btags' },
  sub2: { label: 'Subscript', term: 'wa-zur' },
  vowel: { label: 'Vowel', term: 'dbyangs' },
  suffix: { label: 'Suffix', term: "rjes 'jug" },
  post: { label: 'Post-suffix', term: "yang 'jug" },
  achung: { label: "'a-chung", term: "'a chung" },
  avowel: { label: 'Vowel', term: 'dbyangs' },
};

function tokenize(wy) {
  const out = [];
  let i = 0;
  while (i < wy.length) {
    const ch = wy[i];
    if (ch === '.') {
      out.push({ t: 'sep', wy: '.', start: i, end: i + 1 });
      i++;
    } else if (VOWEL_SIGN[ch] !== undefined) {
      out.push({ t: 'v', wy: ch, start: i, end: i + 1 });
      i++;
    } else {
      const c = CONS.find((x) => wy.startsWith(x, i));
      if (!c) return null;
      out.push({ t: 'c', wy: c, start: i, end: i + c.length });
      i += c.length;
    }
  }
  return out;
}

const part = (role, tok, extra = {}) => ({ role, wy: tok.wy, start: tok.start, end: tok.end, ...extra });

/* Top-to-bottom readings of a vertical stack of consonant tokens. */
function stackReadings(cs) {
  const [a, b, c, d] = cs;
  const out = [];
  const isSub = (s, r) => s && SUB[s.wy] !== undefined && (SUB[s.wy] === null || SUB[s.wy].has(r.wy));
  const isSuper = (s, r) => s && SUPER[s.wy] && SUPER[s.wy].has(r.wy);
  if (cs.length === 1) out.push([part('root', a)]);
  if (cs.length === 2) {
    if (isSub(b, a)) out.push([part('root', a), part('sub', b)]);
    if (isSuper(a, b)) out.push([part('super', a), part('root', b)]);
  }
  if (cs.length === 3) {
    if (isSuper(a, b) && isSub(c, b)) out.push([part('super', a), part('root', b), part('sub', c)]);
    if (isSub(b, a) && b.wy !== 'w' && c.wy === 'w') out.push([part('root', a), part('sub', b), part('sub2', c)]);
  }
  if (cs.length === 4 && isSuper(a, b) && isSub(c, b) && c.wy !== 'w' && d.wy === 'w') {
    out.push([part('super', a), part('root', b), part('sub', c), part('sub2', d)]);
  }
  return out;
}

function headReadings(head) {
  if (head.some((t) => t.t === 'v')) return [];
  const sep = head.findIndex((t) => t.t === 'sep');
  if (sep >= 0) {
    if (sep !== 1 || !PREFIX.has(head[0].wy)) return [];
    return stackReadings(head.slice(2)).map((r) => [part('prefix', head[0]), ...r]);
  }
  const out = stackReadings(head);
  if (head.length >= 2 && PREFIX.has(head[0].wy)) {
    for (const r of stackReadings(head.slice(1))) out.push([part('prefix', head[0]), ...r]);
  }
  return out;
}

function tailReading(tail) {
  if (!tail.length) return [];
  const [a, b, ...rest] = tail;
  if (a.t === 'c' && a.wy === "'" && b && b.t === 'v') {
    const more = tailReading(rest);
    if (!more) return null;
    return [part('achung', a), part('avowel', b), ...more];
  }
  if (tail.length === 1 && a.t === 'c' && SUFFIX.has(a.wy)) return [part('suffix', a)];
  if (tail.length === 2 && a.t === 'c' && b.t === 'c' && SUFFIX.has(a.wy) && POST.has(b.wy)) {
    return [part('suffix', a), part('post', b)];
  }
  return null;
}

function render(parts) {
  let s = '';
  let stacked = false;
  for (const p of parts) {
    if (p.role === 'super') {
      s += BASE[p.wy];
      stacked = true;
    } else if (p.role === 'root') {
      s += stacked ? SUBJ[p.wy || 'a'] : BASE[p.wy || 'a'];
    } else if (p.role === 'sub' || p.role === 'sub2') {
      s += SUBJ[p.wy];
    } else if (p.role === 'vowel' || p.role === 'avowel') {
      s += VOWEL_SIGN[p.wy];
    } else {
      s += BASE[p.wy];
    }
  }
  return s;
}

function describe(p) {
  const info = ROLE_INFO[p.role];
  let detail = '';
  if (p.role === 'super') detail = SUPER_NAME[p.wy];
  else if (p.role === 'sub' || p.role === 'sub2') detail = SUB_NAME[p.wy];
  else if (p.role === 'vowel' || p.role === 'avowel') detail = VOWEL_NAME[p.wy];
  else if (p.role === 'root' && p.implicit) detail = 'a-chen, supplied';
  const bo = p.role === 'vowel' || p.role === 'avowel' ? (VOWEL_SIGN[p.wy] ? '◌' + VOWEL_SIGN[p.wy] : '') : BASE[p.wy || 'a'];
  return { ...p, label: info.label, term: info.term, detail, bo };
}

const memo = new Map();

export function parseSyllable(wy) {
  if (memo.has(wy)) return memo.get(wy);
  const result = parse(wy);
  if (memo.size > 2000) memo.clear();
  memo.set(wy, result);
  return result;
}

function parse(wy) {
  const fail = (reason) => ({ ok: false, wy, reason, parts: [], bo: '' });
  if (!wy || /[\s/]/.test(wy)) return fail('empty');
  if (/[A-Z+0-9]|-/.test(wy)) return fail('sanskrit');
  const { text: bo, warnings } = toUnicode(wy);
  if (warnings.length) return fail('invalid');
  const toks = tokenize(wy);
  if (!toks) return fail('invalid');
  const vi = toks.findIndex((t) => t.t === 'v');
  if (vi < 0) return fail('invalid');
  const head = toks.slice(0, vi);
  const vowel = part('vowel', toks[vi]);
  const tail = tailReading(toks.slice(vi + 1));
  if (!tail) return fail('invalid');

  const heads = head.length ? headReadings(head) : [[{ role: 'root', wy: '', start: toks[vi].start, end: toks[vi].start, implicit: true }]];
  for (const h of heads) {
    const parts = [...h, vowel, ...tail];
    if (render(parts) === bo) return { ok: true, wy, bo, parts: parts.map(describe) };
  }
  return fail('unanalysed');
}

/* The part of a parsed syllable that the character at `offset` belongs to. */
export function partAt(parsed, offset) {
  if (!parsed.ok) return -1;
  return parsed.parts.findIndex((p) => offset >= p.start && offset < p.end);
}

/* The Wylie token (one letter, possibly 2–3 keys) at offset, or null. */
export function tokenAt(wy, offset) {
  const toks = tokenize(wy);
  if (!toks) return null;
  return toks.find((t) => offset >= t.start && offset < t.end) || null;
}
