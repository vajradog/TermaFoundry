/*
  session.js — the typing engine. No DOM.

    const s = new Session(items, { seconds: 60 })   // seconds: 0 for an untimed lesson
    s.type('b', performance.now()) -> { ok, done, expected }
    s.stats(now) -> { wpm, spm, accuracy, elapsed, progress, syllables, ... }

  The text is the items joined with spaces. It is cut into cells, one per Tibetan syllable; each
  cell owns its syllable's Wylie and the separator typed after it (space -> tsheg, / -> shad).

  Accuracy-first: a wrong key is counted and the cursor waits for the right one.
  WPM is the international standard: correct keystrokes / 5 per minute.
*/
import { toUnicode } from '../../foundry/lib/ewts.js';

/* What the keys typed after a syllable look like in the script. */
export function sepToBo(sep) {
  let out = '';
  for (let i = 0; i < sep.length; i++) {
    const c = sep[i];
    if (c === '/') {
      if (sep[i + 1] === '/') {
        out += '༎';
        i++;
      } else out += '།';
    } else if (c === ' ') {
      out += /[།༎]$/.test(out) ? ' ' : '་';
    }
  }
  return out;
}

export function buildCells(items) {
  const cells = [];
  let pos = 0;
  items.forEach((it, wi) => {
    const s = it.w + (wi < items.length - 1 ? ' ' : '');
    const re = /([^ /]+)([ /]*)|([ /]+)/g;
    let m;
    while ((m = re.exec(s)) && m[0]) {
      const start = pos + m.index;
      if (m[3]) {
        // separators with no syllable before them (a leading slash): attach to the previous cell
        const prev = cells[cells.length - 1];
        if (prev) {
          prev.sep += m[3];
          prev.end += m[3].length;
          prev.punct = sepToBo(prev.sep);
        }
        continue;
      }
      const syl = m[1];
      const sep = m[2] || '';
      cells.push({
        index: cells.length,
        word: wi,
        wy: syl,
        sep,
        start,
        sylEnd: start + syl.length,
        end: start + m[0].length,
        bo: toUnicode(syl).text,
        punct: sepToBo(sep),
      });
    }
    pos += s.length;
  });
  return cells;
}

export class Session {
  constructor(items, { seconds = 0 } = {}) {
    this.items = items;
    this.text = items.map((i) => i.w).join(' ');
    this.cells = buildCells(items);
    this.cellAt = new Int32Array(this.text.length + 1);
    for (const c of this.cells) for (let i = c.start; i < c.end; i++) this.cellAt[i] = c.index;
    this.cellAt[this.text.length] = this.cells.length - 1;
    this.seconds = seconds;
    this.pos = 0;
    this.correct = 0;
    this.errors = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.posErrors = 0;
    this.startedAt = 0;
    this.endedAt = 0;
    this.pausedAt = 0;
    this.keys = {}; // char -> [attempts, misses]
    this.confusions = {}; // 'expected→typed' -> count
    this.cellErrors = new Uint16Array(this.cells.length);
  }

  get expected() {
    return this.text[this.pos];
  }
  get done() {
    return this.endedAt > 0;
  }
  get cell() {
    return this.cells[this.cellAt[Math.min(this.pos, this.text.length)]];
  }

  start(now) {
    if (!this.startedAt) this.startedAt = now;
  }

  type(ch, now) {
    if (this.done) return { ok: false, done: true };
    this.resume(now);
    this.start(now);
    const exp = this.text[this.pos];
    const k = this.keys[exp] || (this.keys[exp] = [0, 0]);
    if (ch === exp) {
      if (this.posErrors === 0) k[0]++;
      this.pos++;
      this.correct++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.posErrors = 0;
      if (this.pos >= this.text.length) this.finish(now);
      return { ok: true, done: this.done, expected: exp };
    }
    if (this.posErrors === 0) {
      k[0]++;
      k[1]++;
      this.cellErrors[this.cellAt[this.pos]]++;
    }
    const key = `${exp}→${ch}`;
    this.confusions[key] = (this.confusions[key] || 0) + 1;
    this.errors++;
    this.posErrors++;
    this.streak = 0;
    return { ok: false, done: false, expected: exp };
  }

  finish(now) {
    if (this.pausedAt) this.resume(now);
    if (!this.endedAt) this.endedAt = Math.max(now, this.startedAt + 1);
  }

  /* The clock stops while the learner is away; resuming shifts the start forward. */
  pause(now) {
    if (this.startedAt && !this.done && !this.pausedAt) this.pausedAt = Math.max(now, this.startedAt);
  }
  resume(now) {
    if (this.pausedAt) {
      this.startedAt += Math.max(0, now - this.pausedAt);
      this.pausedAt = 0;
    }
  }

  /* For timed tests: ends the session once the time is up. Returns true when it ended. */
  tick(now) {
    if (this.seconds && this.startedAt && !this.done && !this.pausedAt && now - this.startedAt >= this.seconds * 1000) {
      this.finish(this.startedAt + this.seconds * 1000);
      return true;
    }
    return false;
  }

  elapsed(now) {
    if (!this.startedAt) return 0;
    const end = this.endedAt || this.pausedAt || now;
    const ms = end - this.startedAt;
    return this.seconds ? Math.min(ms, this.seconds * 1000) : ms;
  }

  /* Syllables completed: cells whose last key has been typed. */
  syllablesDone() {
    let n = 0;
    for (const c of this.cells) if (c.sylEnd <= this.pos) n++;
    return n;
  }

  stats(now) {
    const ms = this.elapsed(now);
    const min = ms / 60000;
    const typed = this.correct + this.errors;
    const syl = this.syllablesDone();
    return {
      ms,
      wpm: min > 0.002 ? this.correct / 5 / min : 0,
      spm: min > 0.002 ? syl / min : 0,
      accuracy: typed ? this.correct / typed : 1,
      correct: this.correct,
      errors: this.errors,
      syllables: syl,
      progress: this.text.length ? this.pos / this.text.length : 0,
      streak: this.streak,
      bestStreak: this.bestStreak,
      remaining: this.seconds ? Math.max(0, this.seconds * 1000 - ms) : 0,
    };
  }

  /* The keys missed most in this session: [{ ch, misses, attempts }] */
  problemKeys(max = 5) {
    return Object.entries(this.keys)
      .filter(([, [, m]]) => m > 0)
      .map(([ch, [n, m]]) => ({ ch, attempts: n, misses: m }))
      .sort((a, b) => b.misses - a.misses || b.misses / b.attempts - a.misses / a.attempts)
      .slice(0, max);
  }

  /* Words with at least one mistake, worst first, for review. */
  problemWords(max = 6) {
    const byWord = new Map();
    for (const c of this.cells) {
      const e = this.cellErrors[c.index];
      if (!e || c.sylEnd > this.pos + 1) continue;
      byWord.set(c.word, (byWord.get(c.word) || 0) + e);
    }
    const seen = new Set();
    return [...byWord.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([wi, n]) => ({ ...this.items[wi], misses: n }))
      .filter((it) => (seen.has(it.w) ? false : seen.add(it.w)))
      .slice(0, max);
  }
}

/* Stars: one for finishing, two for 95 % accuracy, three for 97 % and the unit's target speed. */
export function starsFor({ accuracy, wpm }, target) {
  if (accuracy >= 0.97 && wpm >= target) return 3;
  if (accuracy >= 0.95) return 2;
  return 1;
}
