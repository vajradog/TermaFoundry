/*
  ewts.js — the one place the site talks to the EWTS (Extended Wylie) converter.

    toUnicode(wylie)      -> { text, warnings }     whole string, Wylie -> Tibetan Unicode (NFC)
    toWylie(unicode)      -> { text, warnings }     whole string, Tibetan Unicode -> EWTS
    analyze(syllable)     -> { wylie, unicode, warnings, ok }   one tsheg-bar, memoized
    tokenize(text)        -> lines of tokens (Tibetan syllables, Wylie chunks, English, spaces)
    convertLine(tokens)   -> per-token Tibetan output, with a tsheg/space rule between chunks
    convertMixed(text)    -> Tibetan string for a mixed Wylie / Unicode / English text
    markEnglish(text)     -> pasted Tibetan with its English runs put in [brackets]
    stats(unicode)        -> { syllables, shad, chars, minutes }

  The converter itself is vendored in ./vendor (see NOTICE.md there).
*/
import { EwtsConverter } from './vendor/EwtsConverter.mjs';

export const TIBETAN_RE = /[ༀ-࿿]/;
export const TSHEG = '་';
export const NB_TSHEG = '༌';
export const SHAD = '།';
export const NYIS_SHAD = '༎';

const converter = new EwtsConverter({
  check: true,
  check_strict: true,
  sloppy: false,
  fix_spacing: true,
  leave_dubious: false,
  pass_through: true,
});

function cleanWarnings(list) {
  return list.map((w) => w.replace(/^line \d+:\s*/, ''));
}

export function toUnicode(wylie) {
  const text = converter.to_unicode(String(wylie)).normalize('NFC');
  return { text, warnings: cleanWarnings(converter.get_warnings()) };
}

export function toWylie(unicode) {
  const text = converter.to_ewts(String(unicode).normalize('NFC'));
  return { text, warnings: cleanWarnings(converter.get_warnings()) };
}

const NO_TIBETAN = 'No Tibetan characters found!';
const cache = new Map();

export function analyze(syllable) {
  const hit = cache.get(syllable);
  if (hit) return hit;
  const unicode = converter.to_unicode(syllable).normalize('NFC');
  const warnings = cleanWarnings(converter.get_warnings()).filter((w) => w !== NO_TIBETAN);
  const result = { wylie: syllable, unicode, warnings, ok: warnings.length === 0 };
  if (cache.size > 4000) cache.clear();
  cache.set(syllable, result);
  return result;
}

/* A line is split into tokens:
     bo  a run of Tibetan Unicode, one syllable (with its trailing tsheg/shad) per token
     en  text that is not Wylie and is shown as it is: [anything in brackets] (the EWTS mark for
         non-Tibetan text; the brackets are not shown), or a run with no ASCII in it (emoji, ★)
     wy  a run of non-space, non-Tibetan characters: one Wylie tsheg-bar
     sp  a run of spaces or tabs
   Each token carries its [start, end) offsets into the original text; an en token also carries
   `lit`, the text it shows. */
export function tokenize(text) {
  const lines = [];
  let pos = 0;
  const raws = String(text).split('\n');
  for (const raw of raws) {
    const tokens = [];
    const re = /(\[[^\]\n]*\])|([ༀ-࿿]+)|([^\S\n]+)|([^\sༀ-࿿[]+|\[)/g;
    let m;
    while ((m = re.exec(raw))) {
      const start = pos + m.index;
      const end = start + m[0].length;
      if (m[1]) {
        tokens.push({ type: 'en', text: m[1], lit: m[1].slice(1, -1), start, end });
      } else if (m[2]) {
        const sub = /[^་-༔]+[་-༔]*|[་-༔]+/g;
        let s;
        while ((s = sub.exec(m[2]))) {
          tokens.push({ type: 'bo', text: s[0], start: start + s.index, end: start + s.index + s[0].length });
        }
      } else if (m[3]) {
        tokens.push({ type: 'sp', text: m[3], start, end });
      } else if (/^[^\x00-\x7f]+$/.test(m[4])) {
        tokens.push({ type: 'en', text: m[4], lit: m[4], start, end });
      } else {
        tokens.push({ type: 'wy', text: m[4], start, end });
      }
    }
    lines.push({ start: pos, end: pos + raw.length, tokens });
    pos += raw.length + 1;
  }
  return lines;
}

const ENDS_SHAD = /[།༎༔]$/;
const ENDS_TSHEG = /[་༌]$/;
const STARTS_PUNCT = /^[་༌།༎༔]/;

/* Space rule (in Wylie a space is a tsheg):
     at the start of a line a space is dropped; next to English it stays a space; after a shad
     it is a real space; between two runs of Tibetan Unicode (pasted text) it stays as it was;
     when the previous chunk already ends in a tsheg or a space it is dropped; before Tibetan
     punctuation it is dropped; otherwise it becomes a tsheg. */
export function convertLine(tokens) {
  const parts = [];
  let prevOut = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'sp') {
      const prev = tokens[i - 1];
      const next = tokens[i + 1];
      let out;
      if (prevOut === '' || /\s$/.test(prevOut)) out = '';
      else if (prev.type === 'en' || (next && next.type === 'en')) out = t.text;
      else if (ENDS_SHAD.test(prevOut)) out = ' ';
      else if (prev.type === 'bo' && next && next.type === 'bo') out = t.text;
      else if (ENDS_TSHEG.test(prevOut)) out = '';
      else if (next && next.type === 'bo' && STARTS_PUNCT.test(next.text)) out = '';
      else out = TSHEG;
      parts.push({ token: t, out, warnings: [] });
      prevOut += out;
    } else if (t.type === 'bo') {
      const out = t.text.normalize('NFC');
      parts.push({ token: t, out, warnings: [] });
      prevOut += out;
    } else if (t.type === 'en') {
      parts.push({ token: t, out: t.lit, warnings: [] });
      prevOut += t.lit;
    } else {
      const a = analyze(t.text);
      parts.push({ token: t, out: a.unicode, warnings: a.warnings });
      prevOut += a.unicode;
    }
  }
  return parts;
}

export function convertMixed(text) {
  return tokenize(text)
    .map((line) => convertLine(line.tokens).map((p) => p.out).join(''))
    .join('\n');
}

/* Pasted text that has Tibetan in it: each run of English (letters or figures between the
   Tibetan) goes in [brackets], so it stays English instead of being read as Wylie. */
export function markEnglish(text) {
  if (!TIBETAN_RE.test(text)) return text;
  return text.replace(/[^ༀ-࿿\n[\]]*[A-Za-z0-9][^ༀ-࿿\n[\]]*/g, (run) => {
    const [, lead, body, trail] = run.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${lead}[${body}]${trail}`;
  });
}

const LETTER = /[ཀ-ཬྈ-ྌ]/;
const SHADS = /[།༎༑༔]/g;

export function stats(unicode) {
  const chunks = unicode.split(/[་༌།༎༔\s]+/);
  let syllables = 0;
  for (const c of chunks) if (LETTER.test(c)) syllables++;
  const shad = (unicode.match(SHADS) || []).length;
  const chars = [...unicode.replace(/\s/g, '')].length;
  const minutes = syllables / 160; /* an estimate: about 160 syllables a minute */
  return { syllables, shad, chars, minutes };
}
