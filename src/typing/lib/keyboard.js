/*
  keyboard.js — the on-screen keyboard (US layout) with the Tibetan each key types in Wylie.

    const kb = createKeyboard(el, { onKey(ch) {}, legend: true })
    kb.next('g')          highlight the key (and Shift) for the next character; null clears
    kb.press('g', ok)     flash a key as pressed (ok = false flashes it red)
    kb.setNew(['k','h'])  outline the keys a lesson introduces
    kb.setHeat({ g: .4 }) tint keys by error rate (0–1); null clears
    kb.setShift(bool)     show the capital layer
    kb.digraph('kh')      highlight a two-key letter in the legend

  keyFor(ch) -> { id, shift } maps a typed character to its key.
*/

const VOWEL = (sign) => '◌' + sign;

/* id: [latin, tibetan, kind, shifted latin, shifted tibetan, title] */
export const KEYS = {
  '`': ['`', '', 'off', '~', ''],
  1: ['1', '༡', 'num', '!', ''],
  2: ['2', '༢', 'num', '@', ''],
  3: ['3', '༣', 'num', '#', ''],
  4: ['4', '༤', 'num', '$', ''],
  5: ['5', '༥', 'num', '%', ''],
  6: ['6', '༦', 'num', '^', ''],
  7: ['7', '༧', 'num', '&', ''],
  8: ['8', '༨', 'num', '*', ''],
  9: ['9', '༩', 'num', '(', ''],
  0: ['0', '༠', 'num', ')', ''],
  '-': ['-', '', 'off', '_', ''],
  '=': ['=', '', 'off', '+', '+', 'Shift + = joins two letters into a stack (pad+ma)'],
  q: ['q', '', 'off', 'Q', ''],
  w: ['w', 'ཝ', 'cons', 'W', '', 'wa · also the wa-zur ྭ under a letter'],
  e: ['e', VOWEL('ེ'), 'vowel', 'E', '', "e · 'greng bu"],
  r: ['r', 'ར', 'cons', 'R', '', 'ra'],
  t: ['t', 'ཏ', 'cons', 'T', 'ཊ', 'ta · Shift: retroflex ṭa'],
  y: ['y', 'ཡ', 'cons', 'Y', '', 'ya'],
  u: ['u', VOWEL('ུ'), 'vowel', 'U', VOWEL('ཱུ'), 'u · zhabs kyu · Shift: long ū'],
  i: ['i', VOWEL('ི'), 'vowel', 'I', VOWEL('ཱི'), 'i · gi gu · Shift: long ī'],
  o: ['o', VOWEL('ོ'), 'vowel', 'O', '', 'o · na ro'],
  p: ['p', 'པ', 'cons', 'P', '', 'pa'],
  '[': ['[', '', 'off', '{', ''],
  ']': [']', '', 'off', '}', ''],
  '\\': ['\\', '', 'off', '|', ''],
  a: ['a', 'ཨ', 'vowel', 'A', VOWEL('ཱ'), 'a · the inherent vowel; alone, the a-chen ཨ · Shift: long ā'],
  s: ['s', 'ས', 'cons', 'S', 'ཥ', 'sa · also in ts, tsh, sh · Shift (Sh): retroflex ṣa'],
  d: ['d', 'ད', 'cons', 'D', 'ཌ', 'da · also in dz · Shift: retroflex ḍa'],
  f: ['f', '', 'off', 'F', ''],
  g: ['g', 'ག', 'cons', 'G', '', 'ga · also in ng'],
  h: ['h', 'ཧ', 'cons', 'H', 'ཿ', 'ha · after a letter, aspiration: kh ch th ph tsh zh sh · Shift: visarga'],
  j: ['j', 'ཇ', 'cons', 'J', '', 'ja'],
  k: ['k', 'ཀ', 'cons', 'K', '', 'ka'],
  l: ['l', 'ལ', 'cons', 'L', '', 'la'],
  ';': [';', '', 'off', ':', ''],
  "'": ["'", 'འ', 'cons', '"', '', "'a-chung"],
  z: ['z', 'ཟ', 'cons', 'Z', '', 'za · also in zh, dz'],
  x: ['x', '', 'off', 'X', ''],
  c: ['c', 'ཅ', 'cons', 'C', '', 'ca · also in ch'],
  v: ['v', '', 'off', 'V', ''],
  b: ['b', 'བ', 'cons', 'B', '', 'ba'],
  n: ['n', 'ན', 'cons', 'N', 'ཎ', 'na · also in ng, ny · Shift: retroflex ṇa'],
  m: ['m', 'མ', 'cons', 'M', 'ཾ', 'ma · Shift: anusvāra'],
  ',': [',', '', 'off', '<', ''],
  '.': ['.', '·', 'mark', '>', '', 'period: separates a prefix from the root (g.yag)'],
  '/': ['/', '།', 'mark', '?', '', 'shad, the end of a clause'],
};

const ROWS = [
  [['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['backspace', 2]],
  [['tab', 1.5], ['q', 1], ['w', 1], ['e', 1], ['r', 1], ['t', 1], ['y', 1], ['u', 1], ['i', 1], ['o', 1], ['p', 1], ['[', 1], [']', 1], ['\\', 1.5]],
  [['caps', 1.75], ['a', 1], ['s', 1], ['d', 1], ['f', 1], ['g', 1], ['h', 1], ['j', 1], ['k', 1], ['l', 1], [';', 1], ["'", 1], ['enter', 2.25]],
  [['shiftL', 2.25], ['z', 1], ['x', 1], ['c', 1], ['v', 1], ['b', 1], ['n', 1], ['m', 1], [',', 1], ['.', 1], ['/', 1], ['shiftR', 2.75]],
  [['gapL', 4], ['space', 7], ['gapR', 4]],
];

const MOD_LABEL = { backspace: 'delete', tab: 'tab', caps: 'caps', enter: 'return', shiftL: 'shift', shiftR: 'shift', space: '' };

/* Touch-typing fingers: l/r + pinky, ring, middle, index; thumb. */
export const FINGER = {};
const assign = (keys, f) => keys.split(' ').forEach((k) => (FINGER[k] = f));
assign('` 1 q a z tab caps shiftL', 'lp');
assign('2 w s x', 'lr');
assign('3 e d c', 'lm');
assign('4 5 r t f g v b', 'li');
assign('6 7 y u h j n m', 'ri');
assign('8 i k ,', 'rm');
assign('9 o l .', 'rr');
assign("0 - = p [ ] \\ ; ' / enter backspace shiftR", 'rp');
assign('space', 'th');

export const FINGER_NAME = {
  lp: 'left little finger', lr: 'left ring finger', lm: 'left middle finger', li: 'left index finger',
  ri: 'right index finger', rm: 'right middle finger', rr: 'right ring finger', rp: 'right little finger', th: 'thumb',
};

const SHIFTED = { '+': '=', '"': "'", '?': '/', '>': '.', '<': ',', ':': ';', _: '-', '~': '`', '{': '[', '}': ']', '|': '\\', '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0' };

export function keyFor(ch) {
  if (ch == null) return null;
  if (ch === ' ') return { id: 'space', shift: false };
  if (KEYS[ch]) return { id: ch, shift: false };
  if (/^[A-Z]$/.test(ch)) return { id: ch.toLowerCase(), shift: true };
  if (SHIFTED[ch]) return { id: SHIFTED[ch], shift: true };
  return null;
}

/* The Shift key to use: the one on the other hand. */
export function shiftFor(id) {
  return (FINGER[id] || '').startsWith('l') ? 'shiftR' : 'shiftL';
}

export const DIGRAPHS = [
  ['kh', 'ཁ'], ['ng', 'ང'], ['ch', 'ཆ'], ['ny', 'ཉ'], ['th', 'ཐ'], ['ph', 'ཕ'],
  ['ts', 'ཙ'], ['tsh', 'ཚ'], ['dz', 'ཛ'], ['zh', 'ཞ'], ['sh', 'ཤ'],
];

export function createKeyboard(el, { onKey, legend = true, mini = false } = {}) {
  el.classList.add('kbd');
  if (mini) el.classList.add('kbd--mini');
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'On-screen keyboard: each key with the Tibetan it types in Wylie');
  const byId = {};
  const board = document.createElement('div');
  board.className = 'kbd__board';
  for (const row of ROWS) {
    const r = document.createElement('div');
    r.className = 'kbd__row';
    for (const [id, w] of row) {
      const k = document.createElement(id.startsWith('gap') ? 'span' : 'button');
      k.style.flexGrow = String(w);
      if (id.startsWith('gap')) {
        k.className = 'kbd__gap';
        r.appendChild(k);
        continue;
      }
      k.type = 'button';
      k.tabIndex = -1;
      k.dataset.k = id;
      k.dataset.finger = FINGER[id] || '';
      const spec = KEYS[id];
      if (spec) {
        const [lat, bo, kind, slat, sbo, title] = spec;
        k.className = `k k--${kind}`;
        k.innerHTML =
          `<span class="k__lat">${esc(lat)}</span><span class="k__bo" lang="bo">${esc(bo)}</span>` +
          `<span class="k__lat k__lat--s">${esc(slat)}</span><span class="k__bo k__bo--s" lang="bo">${esc(sbo)}</span>`;
        if (sbo) k.classList.add('k--has-s');
        if (title) k.title = title;
        k.setAttribute('aria-label', title ? `${lat}: ${title}` : lat);
      } else {
        k.className = `k k--mod k--${id}`;
        k.innerHTML = id === 'space' ? '<span class="k__lat">space</span><span class="k__bo" lang="bo">་</span>' : `<span class="k__lat">${MOD_LABEL[id] || id}</span>`;
        if (id === 'space') {
          k.title = 'space: the tsheg ་ between syllables';
          k.setAttribute('aria-label', 'space: tsheg');
        } else k.setAttribute('aria-label', MOD_LABEL[id] || id);
      }
      byId[id] = k;
      r.appendChild(k);
    }
    board.appendChild(r);
  }
  el.appendChild(board);

  let legendEl = null;
  const legendById = {};
  if (legend) {
    legendEl = document.createElement('div');
    legendEl.className = 'kbd__legend';
    legendEl.innerHTML = '<span class="kbd__legend-label">Letters typed with two or three keys</span>';
    for (const [wy, bo] of DIGRAPHS) {
      const chip = document.createElement('span');
      chip.className = 'kbd__dg';
      chip.innerHTML = `<b lang="bo">${bo}</b><code>${wy}</code>`;
      legendById[wy] = chip;
      legendEl.appendChild(chip);
    }
    el.appendChild(legendEl);
  }

  let shiftHeld = false;
  let shiftLatched = false;
  let nextIds = [];
  board.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.k');
    if (!k) return;
    e.preventDefault();
    const id = k.dataset.k;
    if (id === 'shiftL' || id === 'shiftR') {
      shiftLatched = !shiftLatched;
      api.setShift(shiftLatched);
      return;
    }
    if (!onKey) return;
    let ch = null;
    if (id === 'space') ch = ' ';
    else if (id === 'backspace') ch = '\b';
    else if (KEYS[id]) {
      const up = shiftLatched;
      ch = up ? (/^[a-z]$/.test(id) ? id.toUpperCase() : KEYS[id][3]) : id;
    }
    if (shiftLatched) {
      shiftLatched = false;
      api.setShift(false);
    }
    if (ch) onKey(ch);
  });

  const flashTimers = new WeakMap();
  const api = {
    el,
    next(ch) {
      for (const id of nextIds) byId[id] && byId[id].classList.remove('is-next');
      nextIds = [];
      const k = keyFor(ch);
      if (!k) return null;
      nextIds.push(k.id);
      if (k.shift) nextIds.push(shiftFor(k.id));
      for (const id of nextIds) byId[id] && byId[id].classList.add('is-next');
      api.setShift(k.shift || shiftHeld);
      return { ...k, finger: FINGER[k.id] };
    },
    press(ch, ok = true) {
      const k = keyFor(ch);
      const node = k && byId[k.id];
      if (!node) return;
      const cls = ok ? 'is-press' : 'is-wrong';
      node.classList.remove('is-press', 'is-wrong');
      void node.offsetWidth;
      node.classList.add(cls);
      clearTimeout(flashTimers.get(node));
      flashTimers.set(
        node,
        setTimeout(() => node.classList.remove(cls), ok ? 160 : 420),
      );
    },
    setNew(ids = []) {
      for (const node of Object.values(byId)) node.classList.remove('is-new');
      for (const id of ids) {
        const node = byId[id === ' ' ? 'space' : id === 'shift' ? 'shiftL' : id === '+' ? '=' : id];
        if (node) node.classList.add('is-new');
        if (id === 'shift' && byId.shiftR) byId.shiftR.classList.add('is-new');
      }
    },
    setHeat(map) {
      for (const [id, node] of Object.entries(byId)) {
        const v = map ? map[id] : undefined;
        if (v == null) {
          node.style.removeProperty('--heat');
          node.classList.remove('is-heat');
        } else {
          node.style.setProperty('--heat', String(Math.max(0, Math.min(1, v))));
          node.classList.add('is-heat');
        }
      }
      el.classList.toggle('kbd--heat', !!map);
    },
    setShift(on) {
      el.classList.toggle('is-shift', !!on);
    },
    holdShift(on) {
      shiftHeld = on;
      el.classList.toggle('is-shift', on || nextIds.some((id) => id.startsWith('shift')));
      for (const id of ['shiftL', 'shiftR']) byId[id] && byId[id].classList.toggle('is-held', on);
    },
    digraph(wy) {
      for (const chip of Object.values(legendById)) chip.classList.remove('is-on');
      if (wy && legendById[wy]) legendById[wy].classList.add('is-on');
    },
  };
  return api;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
