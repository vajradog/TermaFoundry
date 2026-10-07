/*
  app.js — everything on /typing that moves: theme, the spelling demonstration, the anatomy explorer,
  the course map, the practice room, personal bests and the practice log.

  State is kept in localStorage under wylie.* (settings, progress, scores, key statistics, log).
  Every read and write is guarded: the page works the same with storage blocked.
*/
import { toUnicode } from '../foundry/lib/ewts.js';
import { UNITS, LESSONS, LESSON_BY_ID, TESTS } from './data/curriculum.js';
import { LEXICON } from './data/lexicon.js';
import { parseSyllable, tokenAt } from './lib/anatomy.js';
import { buildLesson, buildTimed, buildWeak, buildCustom, weakKeys, rng32 } from './lib/drill.js';
import { Session, starsFor } from './lib/session.js';
import scheme from '../spell/utsang.json';
import { spell } from '../spell/spell.js';
import { createStack } from '../spell/stack.js';
import { createPlayer } from '../spell/player.js';
import { createVoice } from '../spell/voice.js';

/* ───────────────────────── helpers ───────────────────────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const code = (s) => esc(s).replace(/`([^`]+)`/g, '<span class="wy">$1</span>');
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;
const pad2 = (n) => String(n).padStart(2, '0');
const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
};
const today = () => new Date().toISOString().slice(0, 10);
const STAR = 'M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.25 6.5L12 17.3l-5.85 3.15 1.25-6.5L2.6 9.4l6.55-.85z';
const starsSvg = (n, cls = '') => [0, 1, 2].map((i) => `<svg viewBox="0 0 24 24" class="${i < n ? 'on' : ''} ${cls}" aria-hidden="true"><path d="${STAR}"/></svg>`).join('');

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('wylie.' + k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('wylie.' + k, JSON.stringify(v));
    } catch {
      /* storage unavailable: keep going without it */
    }
  },
  del(k) {
    try {
      localStorage.removeItem('wylie.' + k);
    } catch {
      /* ignore */
    }
  },
};

const DEFAULTS = { sound: 'off', size: 'm', font: 'jomolhari' };
const settings = { ...DEFAULTS, ...store.get('settings.v1', {}) };
const saveSettings = () => store.set('settings.v1', settings);

const SPELL = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}spell/`;

const FONTS = {
  jomolhari: "'TT Jomolhari'",
  noto: "'TT Noto Tibetan'",
  ddc: "'TT DDC Uchen'",
  monlam: "'TT Monlam'",
  sans: "'TT Noto Sans'",
  tmu: "'TT Machine Uni'",
};

/* A partly typed syllable, shown as if its vowel were already there: b → བ, br → བྲ, brg → བརྒ. */
const ENDS_CONS = /(tsh|ts|dz|kh|ng|ch|ny|th|ph|zh|sh|[kgcjtdnpbmwzyrlsh'TDNM])$/;
export function preview(wy) {
  const s = String(wy || '').replace(/[.+]+$/, '');
  if (!s) return '';
  if (ENDS_CONS.test(s)) {
    const r = toUnicode(s + 'a');
    if (!r.warnings.length) return r.text;
  }
  return toUnicode(s).text;
}

/* ───────────────────────── sound ───────────────────────── */
let audio = null;
function blip(ok) {
  if (settings.sound !== 'on') return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = ok ? 'triangle' : 'square';
    o.frequency.setValueAtTime(ok ? 1650 + Math.random() * 200 : 150, t);
    g.gain.setValueAtTime(ok ? 0.035 : 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.03 : 0.12));
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + (ok ? 0.035 : 0.13));
  } catch {
    /* no audio */
  }
}

/* ───────────────────────── theme, header, reveal ───────────────────────── */
function initChrome() {
  const root = document.documentElement;
  const meta = $('meta[name="theme-color"]');
  const paint = () => meta && meta.setAttribute('content', root.dataset.theme === 'dark' ? '#0c0d11' : '#f6f4ef');
  paint();
  $('[data-theme-toggle]')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    settings.theme = root.dataset.theme;
    saveSettings();
    paint();
  });

  const tb = $('[data-tb]');
  const onScroll = () => tb && tb.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || reduced()) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    );
    els.forEach((el) => io.observe(el));
  }
}

/* ───────────────────────── syllable chips ───────────────────────── */
function partsHtml(parsed, offset = Infinity, { numbered = false } = {}) {
  if (!parsed || !parsed.ok) return '';
  let n = 0;
  return parsed.parts
    .filter((p) => !(p.role === 'root' && p.implicit))
    .map((p) => {
      n++;
      const state = offset >= p.end ? '' : offset >= p.start ? 'is-cur' : 'is-todo';
      const label = p.detail || p.label;
      return `<span class="part ${state}" data-role="${p.role}"${numbered ? ` data-n="${n}"` : ''}><b>${esc(p.wy)}</b><small>${esc(label)}</small></span>`;
    })
    .join('');
}

/* ───────────────────────── spelling it out (the opening demonstration) ───────────────────────── */
/*
  A stack and the examples beside it. "Spell it" builds the stack piece by piece in the order it is
  spelled in class, each piece red as it is named, then the fused sound with the whole stack red.
  Each unit is spoken when its recording exists (public/spell/audio/), silently until then.
*/
function initSpell() {
  const root = $('[data-spell]');
  if (!root) return;
  const stageEl = $('[data-spell-stage]', root);
  const boEl = $('[data-spell-bo]', root);
  const btn = $('[data-spell-btn]', root);
  const chips = $$('[data-spell-ex]', root);
  let recorded = [];
  try {
    recorded = JSON.parse(root.dataset.spellAudio || '[]');
  } catch {
    /* none */
  }
  const voice = createVoice(`${SPELL}audio/`, recorded);
  let stack = null; // the glyph renderer, once HarfBuzz and the font have loaded
  let current = null;

  const player = createPlayer({
    scheme,
    voice,
    getStack: () => stack,
    onDone: () => root.classList.add('is-paused'),
  });

  function select(wy) {
    player.stop();
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.spellEx === wy ? 'true' : 'false'));
    current = spell(parseSyllable(wy), scheme);
    boEl.textContent = current.text;
    if (stack) {
      stack.frame(current.text);
      stack.draw({ text: current.text });
    }
  }

  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.spellEx)));
  btn.addEventListener('click', () => {
    root.classList.remove('is-paused');
    player.play(current);
  });
  root.addEventListener('keydown', (e) => e.key === 'Escape' && player.stop());
  select(($('[data-spell-ex][aria-pressed="true"]', root) || chips[0]).dataset.spellEx);

  createStack(stageEl, { fontUrl: `${SPELL}yangtso-tibetan.ttf` })
    .then((s) => {
      stack = s;
      root.classList.add('has-stage');
      s.frame(current.text);
      s.draw({ text: current.text });
    })
    .catch((e) => console.warn('spelling stage unavailable, showing text', e));
}

/* ───────────────────────── anatomy explorer ───────────────────────── */
const REASON = {
  sanskrit: 'Sanskrit letters (capitals, +) and figures follow their own rules and are not analysed here.',
  invalid: 'That is not a well-formed Tibetan syllable in Wylie. Try one of the examples.',
  unanalysed: 'The converter accepts this, but it does not follow the native syllable pattern.',
  empty: 'Type a single syllable, without spaces.',
};

function initAnatomy() {
  const root = $('[data-anat]');
  if (!root) return;
  const input = $('[data-anat-input]', root);
  const prev = $('[data-anat-preview]', root);
  const chips = $$('[data-ex]', root);
  const boEl = $('[data-anat-bo]', root);
  const glossEl = $('[data-anat-gloss]', root);
  const xp = $('[data-anat-xp]', root);
  const order = $('[data-anat-order]', root);
  const msg = $('[data-anat-msg]', root);

  const slot = (role, col, row, p, delay) => {
    if (!p) return `<div class="xp__slot is-empty" data-role="${role}" style="grid-column:${col};grid-row:${row}"><span class="xp__bo"></span><span class="xp__wy"></span><span class="xp__role">${esc(ROLE_LABEL[role])}</span></div>`;
    const bo = p.role === 'vowel' && p.wy === 'a' ? '' : p.bo;
    const name = p.detail || p.term;
    return (
      `<div class="xp__slot" data-role="${role}" style="grid-column:${col};grid-row:${row};animation-delay:${delay}ms">` +
      `<span class="xp__bo" lang="bo">${esc(bo)}</span><span class="xp__wy">${esc(p.wy || 'a')}</span>` +
      `<span class="xp__role">${esc(p.label)}<span>${esc(name)}</span></span></div>`
    );
  };
  const ROLE_LABEL = { prefix: 'Prefix', super: 'Superscript', root: 'Root', sub: 'Subscript', vowel: 'Vowel', suffix: 'Suffix', post: 'Post-suffix' };

  function show(raw) {
    const wy = raw.trim().replace(/[’‘ʼ`´]/g, "'");
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.ex === wy ? 'true' : 'false'));
    prev.textContent = wy ? toUnicode(wy).text : '';
    const p = parseSyllable(wy);
    if (!p.ok) {
      boEl.textContent = wy ? toUnicode(wy).text : '';
      glossEl.textContent = '';
      xp.innerHTML = '';
      order.innerHTML = '';
      msg.hidden = false;
      msg.textContent = REASON[p.reason] || REASON.invalid;
      return;
    }
    msg.hidden = true;
    boEl.textContent = p.bo;
    const lex = LEXICON.get(wy);
    glossEl.innerHTML = lex ? `${esc(lex.en)}<small>pronounced ${esc(lex.ph)}</small>` : '';
    const by = {};
    p.parts.forEach((x, i) => (by[x.role] = { ...x, i }));
    const d = (r) => (by[r] ? by[r].i * 70 : 0);
    const v = by.vowel;
    const above = v && v.wy !== 'u';
    const html = [
      slot('prefix', 1, 3, by.prefix, d('prefix')),
      above ? slot('vowel', 2, 1, v, d('vowel')) : '',
      slot('super', 2, 2, by.super, d('super')),
      slot('root', 2, 3, by.root, d('root')),
      slot('sub', 2, 4, by.sub, d('sub')),
      by.sub2 ? slot('sub2', 2, 5, by.sub2, d('sub2')) : '',
      !above ? slot('vowel', 2, by.sub2 ? 6 : 5, v, d('vowel')) : '',
      slot('suffix', 3, 3, by.suffix, d('suffix')),
      slot('post', 4, 3, by.post, d('post')),
      by.achung ? slot('achung', 5, 3, by.achung, d('achung')) : '',
      by.avowel ? slot('avowel', 5, by.avowel.wy === 'u' ? 4 : 2, by.avowel, d('avowel')) : '',
    ].join('');
    xp.innerHTML = html;
    order.innerHTML = partsHtml(p, Infinity, { numbered: true });
  }

  input.addEventListener('input', () => show(input.value));
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      input.value = c.dataset.ex;
      show(c.dataset.ex);
    }),
  );
  show(input.value);
}

/* ───────────────────────── progress, scores, log ───────────────────────── */
const progress = () => store.get('progress.v1', {});
const scores = () => store.get('scores.v1', {});

function renderCourse(currentId) {
  const prog = progress();
  for (const u of UNITS) {
    const card = $(`[data-unit="${u.id}"]`);
    if (!card) continue;
    let done = 0;
    for (const l of u.lessons) {
      const p = prog[l.id];
      if (p && p.stars) done++;
      const btn = $(`[data-lesson="${l.id}"]`, card);
      if (!btn) continue;
      const stars = $('[data-stars]', btn);
      stars.innerHTML = starsSvg(p ? p.stars : 0);
      stars.setAttribute('aria-label', p ? `${p.stars} of 3 stars, best ${Math.round(p.wpm)} WPM` : 'Not yet practised');
      btn.title = p ? `Best ${Math.round(p.wpm)} WPM · ${Math.round(p.acc * 100)}% accuracy` : 'Not yet practised';
      btn.classList.toggle('is-current', l.id === currentId);
    }
    $('[data-unit-prog]', card).textContent = `${done} / ${u.lessons.length}`;
    $('[data-unit-bar]', card).style.width = `${(done / u.lessons.length) * 100}%`;
  }
}

function firstOpenLesson() {
  const prog = progress();
  const l = LESSONS.find((x) => !(prog[x.id] && prog[x.id].stars));
  return (l || LESSONS[0]).id;
}

let scoresTab = 'w60';
let lastScoreAt = 0;
function renderScores() {
  const body = $('[data-scores-body]');
  if (!body) return;
  $$('[data-scores-tabs] [data-test]').forEach((b) => b.setAttribute('aria-selected', b.dataset.test === scoresTab ? 'true' : 'false'));
  const list = scores()[scoresTab] || [];
  if (!list.length) {
    body.innerHTML = `<tr><td class="empty" colspan="5">No scores yet. Take the ${esc(TESTS.find((t) => t.id === scoresTab).label)} test to set one.</td></tr>`;
    return;
  }
  body.innerHTML = list
    .map((s, i) => {
      const d = new Date(s.at);
      return `<tr class="${i === 0 ? 'is-top' : ''} ${s.at === lastScoreAt ? 'is-new' : ''}"><td>${i + 1}</td><td class="w-wpm">${s.wpm.toFixed(1)}</td><td>${Math.round(s.acc * 100)}%</td><td>${s.syl}</td><td>${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>`;
    })
    .join('');
}

function dayStreak(days) {
  const set = new Set(days || []);
  let n = 0;
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

function renderLog() {
  const log = store.get('log.v1', { ms: 0, keys: 0, days: [] });
  const mins = Math.round(log.ms / 60000);
  const el = (s) => $(`[data-log-${s}]`);
  if (!el('time')) return;
  el('time').textContent = mins >= 120 ? `${(mins / 60).toFixed(1)} h` : `${mins} min`;
  el('days').textContent = String(dayStreak(log.days));
  el('keys').textContent = log.keys.toLocaleString();
  const prog = progress();
  el('lessons').textContent = `${LESSONS.filter((l) => prog[l.id] && prog[l.id].stars).length} / ${LESSONS.length}`;
  const weak = weakKeys(store.get('keystats.v1', {}), 6);
  const list = $('[data-weak-list]');
  list.innerHTML = weak.length
    ? `<div class="missed">${weak.map((k) => `<span class="keycap" title="${k.miss} misses in ${k.n} tries">${esc(k.ch === ' ' ? 'space' : k.ch)}<sup>${Math.round((k.miss / k.n) * 100)}%</sup></span>`).join('')}</div>`
    : '<span class="empty-note">Type a few lessons and your weakest keys appear here.</span>';
  $('[data-start-weak]').disabled = !weak.length;
}

function recordSession(s, ms) {
  const ks = store.get('keystats.v1', {});
  for (const [ch, [n, m]] of Object.entries(s.keys)) {
    const k = ks[ch] || (ks[ch] = [0, 0]);
    k[0] += n;
    k[1] += m;
    // let old habits fade: keep the window to the last ~400 attempts per key
    if (k[0] > 400) {
      k[1] = Math.round((k[1] * 400) / k[0]);
      k[0] = 400;
    }
  }
  store.set('keystats.v1', ks);
  const log = store.get('log.v1', { ms: 0, keys: 0, days: [] });
  log.ms += ms;
  log.keys += s.correct;
  const t = today();
  if (!log.days.includes(t)) log.days = [...log.days, t].slice(-400);
  store.set('log.v1', log);
}

/* ───────────────────────── the practice room ───────────────────────── */
function initTrainer() {
  const root = $('[data-trainer]');
  if (!root) return null;
  const el = {
    stage: $('[data-stage]', root),
    screen: $('[data-screen]', root),
    window: $('[data-window]', root),
    text: $('[data-text]', root),
    input: $('[data-input]', root),
    over: $('[data-over]', root),
    kicker: $('[data-tr-kicker]', root),
    title: $('[data-tr-title]', root),
    best: $('[data-tr-best]', root),
    prev: $('[data-prev]', root),
    next: $('[data-next]', root),
    wpm: $('[data-st-wpm]', root),
    spm: $('[data-st-spm]', root),
    acc: $('[data-st-acc]', root),
    time: $('[data-st-time]', root),
    timeK: $('[data-st-time-k]', root),
    prog: $('[data-st-prog]', root),
    streak: $('[data-st-streak]', root),
    bestStreak: $('[data-st-best]', root),
    bar: $('[data-tr-bar]', root),
    now: $('[data-now]', root),
    compose: $('[data-compose]', root),
    parts: $('[data-parts]', root),
    hint: $('[data-hint]', root),
    caps: $('[data-caps]', root),
    pop: $('[data-settings]', root),
    popBtn: $('[data-settings-btn]', root),
  };

  const last = store.get('last.v1', {});
  const T = {
    mode: 'course',
    lesson: LESSON_BY_ID.get(last.lesson) || LESSON_BY_ID.get(firstOpenLesson()),
    testId: TESTS.some((t) => t.id === last.test) ? last.test : 'w60',
    custom: store.get('custom.v1', ''),
    session: null,
    phase: 'brief',
    chars: [],
    cellEls: [],
    lineH: 0,
    topLine: -1,
    lastKeyAt: 0,
    ticker: 0,
    weak: null,
  };

  /* ── settings ── */
  function applySettings() {
    root.dataset.size = settings.size;
    document.documentElement.style.setProperty('--bo', `${FONTS[settings.font] || FONTS.jomolhari}, 'TT Noto Tibetan', serif`);
    $$('[data-set]', root).forEach((b) => b.setAttribute('aria-pressed', settings[b.dataset.set] === b.dataset.v ? 'true' : 'false'));
    const sel = $('[data-set-font]', root);
    if (sel) sel.value = settings.font;
  }

  // after a toolbar click, keys go back to the text (Enter starts, Esc restarts)
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.tr-bar button, .tr-head button');
    if (b && !touch() && T.phase !== 'run') setTimeout(() => el.input.focus({ preventScroll: true }), 0);
  });
  $$('[data-set]', root).forEach((b) =>
    b.addEventListener('click', () => {
      settings[b.dataset.set] = b.dataset.v;
      saveSettings();
      applySettings();
      if (b.dataset.set === 'size') requestAnimationFrame(layout);
      if (b.dataset.set === 'sound' && b.dataset.v === 'on') blip(true);
      refreshCursor();
    }),
  );
  $('[data-set-font]', root)?.addEventListener('change', (e) => {
    settings.font = e.target.value;
    saveSettings();
    applySettings();
    setTimeout(layout, 120);
    document.fonts && document.fonts.ready.then(layout);
  });
  el.popBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = el.pop.hidden;
    el.pop.hidden = !open;
    el.popBtn.setAttribute('aria-expanded', String(open));
    if (open && T.phase === 'run') pause();
  });
  document.addEventListener('click', (e) => {
    if (!el.pop.hidden && !el.pop.contains(e.target) && e.target !== el.popBtn) {
      el.pop.hidden = true;
      el.popBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── header ── */
  function renderHead() {
    const st = el.best;
    el.prev.hidden = el.next.hidden = T.mode !== 'course';
    if (T.mode === 'course') {
      const l = T.lesson;
      el.kicker.textContent = `Unit ${pad2(l.unit.num)} · ${l.unit.title}`;
      el.title.innerHTML = `<span class="lesson__id">${esc(l.id)}</span><span>${esc(l.title)}</span>`;
      const p = progress()[l.id];
      st.innerHTML = p ? `<span class="stars">${starsSvg(p.stars)}</span> best ${Math.round(p.wpm)} WPM · ${Math.round(p.acc * 100)}%` : `three stars: 97% and ${l.unit.target} WPM`;
      const i = LESSONS.indexOf(LESSON_BY_ID.get(l.id));
      el.prev.disabled = i <= 0;
      el.next.disabled = i >= LESSONS.length - 1;
    } else if (T.mode === 'test') {
      const t = TESTS.find((x) => x.id === T.testId);
      el.kicker.textContent = 'Timed test';
      el.title.innerHTML = `<span>${esc(t.label)}</span>`;
      const best = (scores()[t.id] || [])[0];
      st.innerHTML = best ? `personal best <b>${best.wpm.toFixed(1)}</b> WPM` : 'no score yet';
    } else if (T.mode === 'weak') {
      el.kicker.textContent = 'Adaptive drill';
      el.title.innerHTML = '<span>Weak keys</span>';
      st.textContent = 'built from your mistakes';
    } else {
      el.kicker.textContent = 'Your text';
      el.title.innerHTML = '<span>Practise any passage</span>';
      st.textContent = 'Wylie or Tibetan';
    }
    $$('[data-mode]', root).forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === T.mode ? 'true' : 'false'));
    renderCourse(T.mode === 'course' ? T.lesson.id : null);
  }

  /* ── building the text ── */
  function makeItems() {
    if (T.mode === 'course') return buildLesson(T.lesson, rng32((Math.random() * 2 ** 31) | 0));
    if (T.mode === 'test') {
      const t = TESTS.find((x) => x.id === T.testId);
      return buildTimed(t.content, rng32((Math.random() * 2 ** 31) | 0), t.seconds >= 180 ? 600 : 260);
    }
    if (T.mode === 'weak') {
      T.weak = buildWeak(store.get('keystats.v1', {}), rng32((Math.random() * 2 ** 31) | 0));
      return T.weak.items;
    }
    return buildCustom(T.custom).items;
  }

  function prepare() {
    const items = makeItems();
    const seconds = T.mode === 'test' ? TESTS.find((x) => x.id === T.testId).seconds : 0;
    T.session = items.length ? new Session(items, { seconds }) : null;
    renderText();
    updateStats(performance.now());
  }

  function renderText() {
    const s = T.session;
    el.text.innerHTML = '';
    el.text.style.transform = '';
    T.chars = [];
    T.cellEls = [];
    T.topLine = -1;
    T.curCell = -1;
    T.nowChar = null;
    if (!s) return;
    const frag = document.createDocumentFragment();
    s.cells.forEach((c, i) => {
      const cell = document.createElement('span');
      cell.className = 'c';
      const next = s.cells[i + 1];
      const wordEnd = !next || next.word !== c.word;
      cell.style.marginRight = wordEnd ? (c.punct.includes('།') ? '26px' : '18px') : '0';
      const bo = document.createElement('span');
      bo.className = 'c__bo';
      bo.lang = 'bo';
      bo.textContent = (c.bo + c.punct).replace(/\s+$/, '');
      const wy = document.createElement('span');
      wy.className = 'c__wy';
      for (let k = c.start; k < c.end; k++) {
        const ch = s.text[k];
        const ie = document.createElement('i');
        ie.className = ch === ' ' ? 'sp todo' : 'todo';
        ie.textContent = ch === ' ' ? ' ' : ch;
        wy.appendChild(ie);
        T.chars[k] = ie;
      }
      cell.append(bo, wy);
      frag.appendChild(cell);
      T.cellEls[i] = cell;
    });
    el.text.appendChild(frag);
    T.curCell = -1;
    refreshCursor();
    layout();
  }

  /* Keep the line being typed at the top (after the first line), three lines in view. */
  function layout() {
    const s = T.session;
    if (!s || !T.cellEls.length) return;
    const first = T.cellEls[0];
    const line = first.offsetHeight || 1;
    T.lineH = line;
    T.topLine = -1;
    scrollToCursor(true);
  }

  function scrollToCursor(force) {
    const s = T.session;
    if (!s) return;
    const cell = T.cellEls[s.cell ? s.cell.index : 0];
    if (!cell || !T.lineH) return;
    const lineOf = (node) => Math.round(node.offsetTop / T.lineH);
    const top = lineOf(cell);
    if (top !== T.topLine || force) {
      T.topLine = top;
      const y = top ? T.cellEls.find((n) => lineOf(n) === top)?.offsetTop || top * T.lineH : 0;
      el.text.style.transform = `translateY(${-y}px)`;
    }
  }

  /* ── the cursor: classes on the current character and cell, the hint line, the info strip ── */
  function refreshCursor() {
    const s = T.session;
    if (!s) {
      el.now.innerHTML = '';
      el.parts.innerHTML = '';
      $('code', el.compose).textContent = '';
      return;
    }
    const pos = s.pos;
    const cell = s.done ? null : s.cell;
    // cell classes
    if (T.curCell !== (cell ? cell.index : -2)) {
      if (T.curCell >= 0 && T.cellEls[T.curCell]) {
        const prev = T.cellEls[T.curCell];
        prev.classList.remove('is-cur');
        if (s.cells[T.curCell].end <= pos) {
          prev.classList.add('is-done');
          if (s.cellErrors[T.curCell]) prev.classList.add('had-err');
        }
      }
      if (cell) T.cellEls[cell.index].classList.add('is-cur');
      T.curCell = cell ? cell.index : -2;
    }
    // character classes
    if (T.nowChar) T.nowChar.classList.remove('now', 'miss', 'hint');
    const ch = T.chars[pos];
    if (ch && !s.done) {
      ch.classList.add('now');
      if (s.posErrors > 0) ch.classList.add('miss', 'hint');
      T.nowChar = ch;
    } else T.nowChar = null;

    // the hint line: the next key
    const exp = s.done ? null : s.expected;
    if (T.phase === 'brief' || T.phase === 'done') {
      // the overlay explains what to do
    } else if (exp != null) {
      let tokenWy = null;
      if (cell && pos < cell.sylEnd) {
        const tok = tokenAt(cell.wy, pos - cell.start);
        if (tok && tok.wy.length > 1) tokenWy = tok.wy;
      }
      const what =
        exp === ' '
          ? '<b>space</b>, the tsheg'
          : exp === '/'
            ? '<b>/</b>, the shad'
            : `<b>${esc(exp)}</b>${tokenWy ? ` of <b>${esc(tokenWy)}</b>` : ''}${/[A-Z+]/.test(exp) ? ' (with Shift)' : ''}`;
      el.hint.innerHTML = `${s.posErrors > 0 ? 'Not that one. ' : ''}Next key: ${what}`;
    }

    // info strip
    if (cell) {
      const item = s.items[cell.word];
      const isSentence = /[ /]/.test(item.w.trim()) && item.w.trim().split(' ').length > 3;
      const bo = isSentence ? cell.bo : toUnicode(item.w.replace(/[/ ]+$/, '')).text;
      const ph = !isSentence && item.ph ? `pronounced ${esc(item.ph)}` : isSentence ? `<code>${esc(cell.wy)}</code> · syllable ${cell.index - s.cells.findIndex((c) => c.word === cell.word) + 1}` : '';
      el.now.innerHTML = `<span lang="bo">${esc(bo)}</span><div class="now__txt"><div class="now__en">${esc(item.en || '—')}</div><div class="now__ph">${ph}</div></div>`;
      const off = pos - cell.start;
      const typed = cell.wy.slice(0, Math.min(off, cell.wy.length));
      $('code', el.compose).textContent = typed || ' ';
      let pv = el.compose.querySelector('[lang="bo"]');
      if (!pv) {
        el.compose.insertAdjacentHTML('beforeend', '<span class="compose__arrow">→</span><span lang="bo"></span>');
        pv = el.compose.querySelector('[lang="bo"]');
      }
      pv.textContent = off >= cell.wy.length ? cell.bo + cell.punct.trim() : preview(typed);
      el.parts.innerHTML = partsHtml(parseSyllable(cell.wy), off) || `<span class="empty-note"><code>${esc(cell.wy)}</code> — ${/\d/.test(cell.wy) ? 'Tibetan figures' : 'a Sanskrit form'}</span>`;
    }
    scrollToCursor(false);
  }

  /* ── stats ── */
  function updateStats(now) {
    const s = T.session;
    if (!s) {
      el.wpm.textContent = '0';
      el.spm.textContent = '0 syl/min';
      el.acc.innerHTML = '100<small>%</small>';
      el.time.textContent = '0:00';
      el.prog.innerHTML = '0<small>/0</small>';
      el.streak.textContent = '0';
      el.bar.style.width = '0';
      return;
    }
    const st = s.stats(now);
    el.wpm.textContent = st.wpm >= 100 ? Math.round(st.wpm) : st.wpm.toFixed(st.wpm ? 1 : 0);
    el.spm.textContent = `${Math.round(st.spm)} syl/min`;
    el.acc.innerHTML = `${Math.floor(st.accuracy * 100)}<small>%</small>`;
    if (s.seconds) {
      el.timeK.textContent = 'Time left';
      el.time.textContent = fmtTime(s.startedAt ? st.remaining : s.seconds * 1000);
    } else {
      el.timeK.textContent = 'Time';
      el.time.textContent = fmtTime(st.ms);
    }
    el.prog.innerHTML = s.seconds ? `${st.syllables}<small> syl</small>` : `${st.syllables}<small>/${s.cells.length}</small>`;
    el.streak.textContent = String(st.streak);
    el.bestStreak.textContent = `best ${st.bestStreak}`;
    el.bar.style.width = `${(s.seconds ? 1 - st.remaining / (s.seconds * 1000) : st.progress) * 100}%`;
  }

  function startTicker() {
    clearInterval(T.ticker);
    T.ticker = setInterval(() => {
      const s = T.session;
      if (!s || T.phase !== 'run') return;
      const now = performance.now();
      if (s.tick(now)) return finish();
      // away from the keyboard: stop the clock (not in timed tests)
      if (!s.seconds && s.startedAt && now - T.lastKeyAt > 12000) {
        s.pause(T.lastKeyAt + 1500);
        T.phase = 'paused';
        showPaused('Paused while you were away');
      }
      updateStats(now);
    }, 200);
  }

  /* ── phases ── */
  function showBrief() {
    T.phase = 'brief';
    prepare();
    renderHead();
    el.over.hidden = false;
    el.over.innerHTML = briefHtml();
    wireBrief();
    el.hint.innerHTML = 'Press <b>Enter</b> or start typing to begin.';
    if (T.mode === 'course') store.set('last.v1', { lesson: T.lesson.id, test: T.testId });
  }

  function briefHtml() {
    if (T.mode === 'course') {
      const l = T.lesson;
      const firstOfUnit = l.unit.lessons[0].id === l.id;
      const items = T.session ? [...new Map(T.session.items.map((i) => [i.w, i])).values()].slice(0, l.drill.kind === 'sentences' ? 2 : 5) : [];
      const keys = l.keys.map((k) => `<span class="keycap">${k === ' ' ? 'space' : k === 'shift' ? 'shift' : esc(k)}</span>`).join('');
      return `<div class="card" role="dialog" aria-label="Lesson ${esc(l.id)}">
        <span class="eyebrow"><span class="eyebrow__dot"></span>Lesson ${esc(l.id)} · Unit ${l.unit.num}, ${esc(l.unit.title)}</span>
        <h4>${esc(l.title)}</h4>
        ${firstOfUnit ? `<p class="card__note" style="margin-bottom:10px">${code(l.unit.intro)}</p>` : ''}
        <p class="card__note">${code(l.note)}</p>
        <div class="card__row">
          ${keys ? `<div><div class="card__label">New keys</div><div class="keycaps">${keys}</div></div>` : ''}
          <div><div class="card__label">${l.drill.kind === 'sentences' ? 'Begins with' : 'You will type'}</div><div class="card__ex">${items
            .map((i) => `<div class="ex"><span lang="bo">${esc(toUnicode(i.w.replace(/[/ ]+$/, '')).text)}</span><code>${esc(i.w)}</code></div>`)
            .join('')}</div></div>
        </div>
        <div class="card__actions">
          <button class="btn btn--primary" type="button" data-go>Start lesson <kbd>↵</kbd></button>
          ${LESSONS.indexOf(LESSON_BY_ID.get(l.id)) < LESSONS.length - 1 ? '<button class="btn btn--ghost btn--sm" type="button" data-skip>Skip to next</button>' : ''}
          <span class="muted">${T.session ? `${T.session.cells.length} syllables` : ''} · or just start typing</span>
        </div>
      </div>`;
    }
    if (T.mode === 'test') {
      const t = TESTS.find((x) => x.id === T.testId);
      const list = scores()[t.id] || [];
      return `<div class="card" role="dialog" aria-label="Timed test">
        <span class="eyebrow"><span class="eyebrow__dot"></span>Timed test</span>
        <h4>How fast is your Wylie?</h4>
        <p class="card__note">${
          t.content === 'words'
            ? 'Everyday words from the whole course, in random order. The clock starts with your first key and does not stop for mistakes.'
            : 'The course sentences, shads and all. The clock starts with your first key and does not stop for mistakes.'
        } Your ten best results are kept on this device.</p>
        <div class="card__row">
          <div><div class="card__label">Test</div><div class="seg" role="group" aria-label="Test">${TESTS.map(
            (x) => `<button type="button" data-pick-test="${x.id}" aria-pressed="${x.id === t.id}">${esc(x.label)}</button>`,
          ).join('')}</div></div>
          <div><div class="card__label">Personal best</div><div style="font:400 30px/1 var(--serif);color:var(--ink)">${list[0] ? `${list[0].wpm.toFixed(1)} <small style="font:500 13px var(--sans);color:var(--ink-3)">WPM · ${Math.round(list[0].acc * 100)}%</small>` : '—'}</div></div>
        </div>
        <div class="card__actions">
          <button class="btn btn--primary" type="button" data-go>Start the clock <kbd>↵</kbd></button>
          <span class="muted">or just start typing</span>
        </div>
      </div>`;
    }
    if (T.mode === 'weak') {
      const keys = T.weak ? T.weak.keys : [];
      return `<div class="card" role="dialog" aria-label="Weak keys">
        <span class="eyebrow"><span class="eyebrow__dot"></span>Adaptive drill</span>
        <h4>Work on your weakest keys</h4>
        ${
          keys.length
            ? `<p class="card__note">Every key you have typed is counted. These are the ones you miss most often; this drill picks words that are full of them.</p>
               <div class="card__row"><div><div class="card__label">Your weakest keys</div><div class="missed">${keys
                 .map((k) => `<span class="keycap">${esc(k.ch)}<sup>${Math.round((k.miss / k.n) * 100)}%</sup></span>`)
                 .join('')}</div></div></div>
               <div class="card__actions"><button class="btn btn--primary" type="button" data-go>Start the drill <kbd>↵</kbd></button><span class="muted">${T.session ? T.session.cells.length : 0} syllables</span></div>`
            : `<p class="card__note">There is not enough data yet. Practise a few lessons from the course and come back: the drill is built from the keys you actually miss.</p>
               <div class="card__actions"><button class="btn btn--primary" type="button" data-to-course>Go to the course</button></div>`
        }
      </div>`;
    }
    const res = buildCustom(T.custom);
    return `<div class="card" role="dialog" aria-label="Your own text">
      <span class="eyebrow"><span class="eyebrow__dot"></span>Your text</span>
      <h4>Practise any passage</h4>
      <p class="card__note">Paste a passage from your reader in Tibetan script or in Wylie. Tibetan is converted to Wylie for you; every line or sentence becomes part of the drill.</p>
      <textarea data-custom placeholder="bkra shis bde legs/ nga'i ming la bkra shis zer gyi yod/&#10;— or paste Tibetan: བཀྲ་ཤིས་བདེ་ལེགས།">${esc(T.custom)}</textarea>
      <div class="card__warn" data-custom-warn ${res.warnings.length ? '' : 'hidden'}>Not valid Wylie: ${esc(res.warnings.slice(0, 8).join(', '))}</div>
      <div class="card__actions">
        <button class="btn btn--primary" type="button" data-go ${res.items.length ? '' : 'disabled'}>Practise this text</button>
        <span class="muted" data-custom-count>${res.items.length ? `${T.session ? T.session.cells.length : 0} syllables` : 'Nothing to practise yet'}</span>
      </div>
    </div>`;
  }

  function wireBrief() {
    $('[data-go]', el.over)?.addEventListener('click', () => {
      if (T.mode === 'custom') {
        T.custom = $('[data-custom]', el.over).value;
        store.set('custom.v1', T.custom);
        prepare();
        if (!T.session) return;
      }
      begin();
    });
    $('[data-skip]', el.over)?.addEventListener('click', () => goLesson(1));
    $('[data-to-course]', el.over)?.addEventListener('click', () => setMode('course'));
    $$('[data-pick-test]', el.over).forEach((b) =>
      b.addEventListener('click', () => {
        T.testId = b.dataset.pickTest;
        store.set('last.v1', { lesson: T.lesson.id, test: T.testId });
        scoresTab = T.testId;
        renderScores();
        showBrief();
      }),
    );
    const ta = $('[data-custom]', el.over);
    if (ta) {
      ta.addEventListener('input', () => {
        T.custom = ta.value;
        store.set('custom.v1', T.custom);
        const r = buildCustom(T.custom);
        const warn = $('[data-custom-warn]', el.over);
        warn.hidden = !r.warnings.length;
        warn.textContent = r.warnings.length ? `Not valid Wylie: ${r.warnings.slice(0, 8).join(', ')}` : '';
        $('[data-go]', el.over).disabled = !r.items.length;
        $('[data-custom-count]', el.over).textContent = r.items.length ? `${r.items.length} line${r.items.length > 1 ? 's' : ''}` : 'Nothing to practise yet';
      });
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          $('[data-go]', el.over).click();
        }
      });
    }
  }

  function begin() {
    if (!T.session) return;
    el.over.hidden = true;
    el.over.innerHTML = '';
    T.phase = 'run';
    T.lastKeyAt = performance.now();
    refreshCursor();
    focusInput();
    startTicker();
    bringIntoView();
  }

  /* While typing, keep the whole practice screen in view. */
  function bringIntoView() {
    const top = $('.tr-stats', root).getBoundingClientRect().top;
    const bottom = $('.tr-foot', root).getBoundingClientRect().bottom;
    const head = 72;
    if (top >= head && bottom <= window.innerHeight) return;
    const y = window.scrollY + (bottom - top + head > window.innerHeight ? top - head : $('.tr-head', root).getBoundingClientRect().top - head);
    window.scrollTo({ top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth' });
  }

  function showPaused(text = 'Paused') {
    el.over.hidden = false;
    el.over.innerHTML = `<button class="focus-msg" type="button" data-resume><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"></path></svg>${esc(text)} — click or press any key to continue</button>`;
    $('[data-resume]', el.over).addEventListener('click', () => resume());
  }

  function pause() {
    if (T.phase !== 'run' || !T.session) return;
    T.session.pause(performance.now());
    T.phase = 'paused';
    showPaused();
    updateStats(performance.now());
  }

  function resume() {
    if (T.phase !== 'paused') return;
    T.session.resume(performance.now());
    T.phase = 'run';
    T.lastKeyAt = performance.now();
    el.over.hidden = true;
    el.over.innerHTML = '';
    focusInput();
  }

  function restart() {
    clearInterval(T.ticker);
    T.phase = 'brief';
    prepare();
    begin();
  }

  function finish() {
    const s = T.session;
    if (!s) return;
    clearInterval(T.ticker);
    const now = performance.now();
    s.finish(now);
    T.phase = 'done';
    const st = s.stats(now);
    updateStats(now);
    refreshCursor();
    const meaningful = s.correct >= 8;
    if (meaningful) recordSession(s, st.ms);

    let head = '';
    let actions = '';
    let extra = '';
    if (T.mode === 'course') {
      const l = T.lesson;
      const prog = progress();
      const prev = prog[l.id];
      const stars = starsFor(st, l.unit.target);
      const best = !prev || st.wpm > prev.wpm;
      if (meaningful) {
        prog[l.id] = {
          stars: Math.max(stars, prev ? prev.stars : 0),
          wpm: Math.max(st.wpm, prev ? prev.wpm : 0),
          acc: best ? st.accuracy : prev.acc,
          runs: (prev ? prev.runs : 0) + 1,
          at: Date.now(),
        };
        store.set('progress.v1', prog);
      }
      const nextL = LESSONS[LESSONS.indexOf(LESSON_BY_ID.get(l.id)) + 1];
      head = `<div class="res__top"><span class="res__stars" aria-label="${stars} of 3 stars">${starsSvg(stars)}</span>${prev && best ? '<span class="badge">New personal best</span>' : ''}</div>
        <h4>${stars === 3 ? 'Excellent.' : stars === 2 ? 'Well done.' : 'Lesson complete.'}</h4>
        <p class="card__note">${
          stars === 3
            ? `Three stars for lesson ${esc(l.id)}. ${nextL ? 'On to the next one.' : 'That was the last lesson of the course.'}`
            : stars === 2
              ? `Two stars. For the third, reach 97% accuracy at ${l.unit.target} WPM.`
              : 'One star. Slow down a little: at 95% accuracy you earn the second star, and speed comes with accuracy.'
        }</p>`;
      actions = `<button class="btn" type="button" data-again>Again <kbd>Esc</kbd></button>
        ${nextL ? `<button class="btn btn--primary" type="button" data-nextl>Next: ${esc(nextL.id)} ${esc(nextL.title)} <kbd>↵</kbd></button>` : '<button class="btn btn--primary" type="button" data-totest>Take a timed test <kbd>↵</kbd></button>'}`;
    } else if (T.mode === 'test') {
      const all = scores();
      const list = all[T.testId] || [];
      let rank = -1;
      if (meaningful) {
        const entry = { wpm: st.wpm, acc: st.accuracy, syl: st.syllables, at: Date.now() };
        lastScoreAt = entry.at;
        const merged = [...list, entry].sort((a, b) => b.wpm - a.wpm).slice(0, 10);
        rank = merged.indexOf(entry);
        all[T.testId] = merged;
        store.set('scores.v1', all);
        scoresTab = T.testId;
      }
      head = `<div class="res__top">${rank === 0 ? '<span class="badge">New personal best</span>' : rank > 0 ? `<span class="badge">#${rank + 1} on your board</span>` : ''}</div>
        <h4>${rank === 0 ? 'A new personal best.' : 'Time.'}</h4>
        <p class="card__note">${meaningful ? `${st.syllables} syllables in ${fmtTime(st.ms)}, at ${Math.round(st.accuracy * 100)}% accuracy.` : 'Too few keys to count. Try again when you are ready.'}</p>`;
      actions = `<button class="btn btn--primary" type="button" data-again>Again <kbd>↵</kbd></button><a class="btn" href="#scores" data-viewscores>See your bests</a>`;
    } else {
      head = `<h4>Done.</h4><p class="card__note">${st.syllables} syllables at ${Math.round(st.accuracy * 100)}% accuracy.</p>`;
      actions = `<button class="btn btn--primary" type="button" data-again>Again <kbd>↵</kbd></button>${T.mode === 'weak' ? '<button class="btn" type="button" data-to-course>Back to the course</button>' : ''}`;
    }

    const pk = s.problemKeys(6);
    const pw = s.problemWords(5);
    extra = `<div class="res__cols">
      <div><div class="card__label">Keys you missed</div>${
        pk.length ? `<div class="missed">${pk.map((k) => `<span class="keycap">${k.ch === ' ' ? 'space' : esc(k.ch)}<sup>${k.misses}</sup></span>`).join('')}</div>` : '<p class="empty-note">None. Clean typing.</p>'
      }</div>
      <div><div class="card__label">Worth another look</div>${
        pw.length
          ? `<ul class="review">${pw
              .map((w) => `<li><span lang="bo">${esc(toUnicode(w.w.replace(/[/ ]+$/, '')).text)}</span><code>${esc(w.w)}</code><span>${esc(w.en || '')}</span></li>`)
              .join('')}</ul>`
          : '<p class="empty-note">Every word typed without a slip.</p>'
      }</div>
    </div>`;

    el.over.hidden = false;
    el.over.innerHTML = `<div class="card" role="dialog" aria-label="Results">${head}
      <div class="res__nums">
        <div class="big"><span class="card__label">WPM</span><b>${st.wpm.toFixed(1)}</b></div>
        <div><span class="card__label">Accuracy</span><b>${(Math.floor(st.accuracy * 1000) / 10).toFixed(1)}<small>%</small></b></div>
        <div><span class="card__label">Time</span><b>${fmtTime(st.ms)}</b></div>
        <div><span class="card__label">Syllables/min</span><b>${Math.round(st.spm)}</b></div>
      </div>
      ${extra}
      <div class="card__actions">${actions}</div>
    </div>`;
    $('[data-again]', el.over)?.addEventListener('click', restart);
    $('[data-nextl]', el.over)?.addEventListener('click', () => goLesson(1));
    $('[data-totest]', el.over)?.addEventListener('click', () => setMode('test'));
    $('[data-to-course]', el.over)?.addEventListener('click', () => setMode('course'));
    $('[data-viewscores]', el.over)?.addEventListener('click', () => renderScores());

    el.hint.innerHTML = $('[data-nextl]', el.over) ? 'Press <b>Enter</b> for the next lesson, <b>Esc</b> to try again.' : 'Press <b>Enter</b> to go again.';
    renderHead();
    renderScores();
    renderLog();
    if (!touch()) el.input.focus({ preventScroll: true });
  }

  /* ── input ── */
  function normalize(ch) {
    if (/[’‘ʼ´`]/.test(ch)) return "'";
    if (ch.length === 1 && ch.charCodeAt(0) > 127) {
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (base.length === 1) return base;
    }
    return ch;
  }

  function onChar(raw) {
    const s = T.session;
    if (!s) return;
    const ch = normalize(raw);
    if (T.phase === 'done') return;
    if (T.phase === 'brief') {
      if (T.mode === 'custom' || (T.mode === 'weak' && !(T.weak && T.weak.keys.length))) return;
      begin();
    }
    if (T.phase === 'paused') resume();
    const now = performance.now();
    T.lastKeyAt = now;
    const res = s.type(ch, now);
    blip(res.ok);
    if (!res.ok) {
      const cell = T.cellEls[s.cell.index];
      cell.classList.remove('is-shake');
      void cell.offsetWidth;
      cell.classList.add('is-shake');
    } else {
      const prevChar = T.chars[s.pos - 1];
      if (prevChar) prevChar.classList.remove('todo', 'now', 'miss', 'hint');
      if (prevChar) prevChar.classList.add('ok');
    }
    refreshCursor();
    updateStats(now);
    if (res.done) finish();
  }

  function onEnter() {
    if (T.phase === 'brief') {
      const go = $('[data-go]', el.over);
      if (go && !go.disabled) go.click();
      else if ($('[data-to-course]', el.over)) setMode('course');
    } else if (T.phase === 'paused') resume();
    else if (T.phase === 'done') {
      const btn = $('[data-nextl]', el.over) || $('[data-totest]', el.over) || $('[data-again]', el.over);
      btn && btn.click();
    }
  }

  el.input.addEventListener('keydown', (e) => {
    if (e.getModifierState) el.caps.hidden = !e.getModifierState('CapsLock');
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (T.phase === 'done' || T.phase === 'run' || T.phase === 'paused') restart();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
      return;
    }
    if (e.key === 'Tab') return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      el.hint.textContent = 'No need to delete: the cursor waits for the right key.';
      return;
    }
    let ch = e.key;
    if (ch === 'Dead') ch = e.code === 'Quote' ? "'" : e.code === 'Backquote' ? '`' : null;
    if (ch && ch.length === 1) {
      e.preventDefault();
      onChar(ch);
    }
  });
  /* Phone and tablet keyboards (and desktop input methods) do not send usable key events: read
     what arrives in the box instead. While a word is being composed, take only the new letters
     and leave the box alone; clear it once the composition ends. */
  let composing = false;
  let seen = '';
  function drain() {
    const v = el.input.value.replace(/\n/g, '');
    if (v.startsWith(seen)) for (const ch of v.slice(seen.length)) onChar(ch);
    seen = v;
    if (!composing) {
      el.input.value = '';
      seen = '';
    }
  }
  el.input.addEventListener('compositionstart', () => (composing = true));
  el.input.addEventListener('compositionend', () => {
    composing = false;
    drain();
  });
  el.input.addEventListener('input', drain);
  el.input.addEventListener('blur', () => {
    if (T.phase === 'run') setTimeout(() => document.activeElement !== el.input && pause(), 60);
  });

  /* Focus the typing box. On a phone this opens the device's own keyboard, so it is only called
     from a tap or a click. */
  function focusInput() {
    el.input.focus({ preventScroll: true });
  }
  function refocus() {
    if (T.phase === 'run' || T.phase === 'paused') focusInput();
  }

  el.screen.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.card') || e.target.closest('.focus-msg')) return;
    e.preventDefault();
    if (T.phase === 'paused') resume();
    else if (T.phase === 'brief') {
      const go = $('[data-go]', el.over);
      if (go && !go.disabled && T.mode !== 'custom') begin();
    }
    el.input.focus({ preventScroll: true });
  });

  // Typing while the practice room fills most of the screen starts the lesson without a click.
  const inView = () => {
    const r = el.screen.getBoundingClientRect();
    return Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) > Math.min(r.height, window.innerHeight) * 0.5;
  };
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === el.input || e.ctrlKey || e.metaKey || e.altKey || !inView()) return;
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
    if (a && a.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key === 'Enter' && T.phase !== 'run') {
      e.preventDefault();
      el.input.focus({ preventScroll: true });
      onEnter();
    } else if (e.key.length === 1 && e.key !== ' ' && T.phase !== 'done') {
      e.preventDefault();
      el.input.focus({ preventScroll: true });
      onChar(e.key);
    } else if (e.key === ' ' && T.phase === 'paused') {
      e.preventDefault();
      resume();
    }
  });

  /* ── navigation ── */
  function setMode(mode, { scroll = false } = {}) {
    clearInterval(T.ticker);
    T.mode = mode;
    showBrief();
    if (scroll) root.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function loadLesson(id, { scroll = false } = {}) {
    const l = LESSON_BY_ID.get(id);
    if (!l) return;
    T.lesson = l;
    setMode('course', { scroll });
  }
  function goLesson(step) {
    const i = LESSONS.indexOf(LESSON_BY_ID.get(T.lesson.id)) + step;
    if (i < 0 || i >= LESSONS.length) return;
    T.lesson = LESSONS[i];
    setMode('course');
    if (!touch()) el.input.focus({ preventScroll: true });
  }
  el.prev.addEventListener('click', () => goLesson(-1));
  el.next.addEventListener('click', () => goLesson(1));
  $$('[data-mode]', root).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  window.addEventListener('resize', () => {
    clearTimeout(T.rz);
    T.rz = setTimeout(layout, 120);
  });
  document.fonts && document.fonts.ready.then(layout);

  applySettings();
  showBrief();

  return {
    loadLesson,
    setMode,
    test(id, opts) {
      T.testId = id;
      setMode('test', opts);
    },
    startCourse(opts) {
      T.lesson = LESSON_BY_ID.get(T.mode === 'course' && T.lesson ? T.lesson.id : firstOpenLesson()) || LESSONS[0];
      setMode('course', opts);
    },
    focus() {
      if (!touch()) el.input.focus({ preventScroll: true });
    },
  };
}

/* ───────────────────────── boot ───────────────────────── */
export function boot() {
  initChrome();
  initSpell();
  initAnatomy();
  const trainer = initTrainer();
  renderScores();
  renderLog();
  if (!trainer) return;

  $$('[data-lesson]').forEach((b) =>
    b.addEventListener('click', () => {
      trainer.loadLesson(b.dataset.lesson, { scroll: true });
      trainer.focus();
    }),
  );
  $$('[data-go-practice]').forEach((a) =>
    a.addEventListener('click', () => {
      trainer.startCourse();
      setTimeout(() => trainer.focus(), 500);
    }),
  );
  $$('[data-scores-tabs] [data-test]').forEach((b) =>
    b.addEventListener('click', () => {
      scoresTab = b.dataset.test;
      renderScores();
    }),
  );
  $('[data-start-test]')?.addEventListener('click', () => {
    trainer.test(scoresTab, { scroll: true });
    trainer.focus();
  });
  $('[data-start-weak]')?.addEventListener('click', () => {
    trainer.setMode('weak', { scroll: true });
    trainer.focus();
  });
  $('[data-reset]')?.addEventListener('click', () => {
    if (!window.confirm('Reset all progress, high scores and key statistics on this device?')) return;
    ['progress.v1', 'scores.v1', 'keystats.v1', 'log.v1', 'last.v1'].forEach((k) => store.del(k));
    renderScores();
    renderLog();
    trainer.loadLesson('1.1');
  });
}
