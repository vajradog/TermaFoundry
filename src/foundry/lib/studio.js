/*
  studio.js — the Writing Studio editor.

  A hidden <textarea> holds the source (Wylie and/or Tibetan Unicode) and owns the caret, the
  selection, undo and every native keyboard behaviour. A mirror renders that source as Tibetan,
  token by token, and maps clicks back to caret positions. The page shows one document and three
  controls: the weight, the font size and the text itself. (The layouts other than 'tibetan' are
  still drawn by render() but no longer offered.)

  Documents and preferences live in localStorage under STORE_KEY.
*/
import { tokenize, convertLine, markEnglish, stats } from './ewts.js';
import { FONTS, SAMPLES, isCovered } from '../data/fonts.js';
import { BUILD } from '../config.js';

const STORE_KEY = 'foundry.studio.v1';
const DEFAULT_PREFS = {
  layout: 'tibetan',
  size: 34,
  leading: 2,
  hints: true,
  coverage: true,
  warn: true,
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const pad2 = (n) => String(n).padStart(2, '0');
const timeOf = (ms) => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.docs)) {
        // A document saved with a font that is no longer on the site opens in Yangtso.
        for (const d of s.docs) if (!FONTS[d.font]) d.font = 'yangtso';
        // Only the font size is a setting now; the layout, line spacing and typing aids stay at
        // their defaults, whatever an earlier visit saved.
        const saved = s.prefs || {};
        const prefs = { ...DEFAULT_PREFS };
        if (Number(saved.size)) prefs.size = Number(saved.size);
        return { docs: s.docs, currentId: s.currentId || null, prefs };
      }
    }
  } catch (e) {
    /* ignore a broken store */
  }
  return { docs: [], currentId: null, prefs: { ...DEFAULT_PREFS } };
}

function uncovered(out) {
  const missing = [];
  for (const ch of out) {
    const cp = ch.codePointAt(0);
    if (cp === 10 || cp === 9) continue;
    if (!isCovered(cp) && !missing.includes(ch)) missing.push(ch);
  }
  return missing.length ? missing.map((ch) => `${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`).join(', ') : '';
}

export function initStudio(root) {
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));

  const ta = $('[data-ta]');
  const mirror = $('[data-mirror]');
  const col = $('[data-col]');
  const savedEl = $('[data-saved]');
  const toastEl = $('[data-toast]');
  const liveEl = $('[data-live]');
  const statEl = {
    syl: $('[data-stat-syl]'),
    shad: $('[data-stat-shad]'),
    chars: $('[data-stat-chars]'),
    read: $('[data-stat-read]'),
    bad: $('[data-stat-bad]'),
    badWrap: $('[data-stat-bad-wrap]'),
  };

  const state = loadState();
  let doc = null;
  let uniCache = '';
  let focused = false;
  let saveTimer = 0;
  let renderRaf = 0;
  let liveTimer = 0;
  let toastTimer = 0;
  let syncing = false;
  let lastRenderKey = '';

  /* ---------- persistence ---------- */
  function persist() {
    saveTimer = 0;
    if (doc) {
      doc.text = ta.value;
      doc.updated = Date.now();
      state.currentId = doc.id;
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      if (savedEl) savedEl.textContent = `Saved ${timeOf(Date.now())}`;
    } catch (e) {
      if (savedEl) savedEl.textContent = 'Could not save (storage full?)';
    }
  }
  function saveSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 500);
  }

  /* ---------- documents ---------- */
  function newDoc(init = {}) {
    const d = {
      id: uid(),
      title: '',
      titleLocked: false,
      text: '',
      font: 'yangtso',
      weight: 400,
      sample: null,
      created: Date.now(),
      updated: Date.now(),
      ...init,
    };
    state.docs.unshift(d);
    return d;
  }
  function openDoc(id) {
    const d = state.docs.find((x) => x.id === id);
    if (!d) return;
    if (doc && doc !== d) persist();
    doc = d;
    state.currentId = d.id;
    ta.value = d.text || '';
    ta.setSelectionRange(ta.value.length, ta.value.length);
    applyDoc();
    render(true);
    saveSoon();
    mirror.scrollTop = 0;
  }
  function openSample(key) {
    const s = SAMPLES[key];
    if (!s) return;
    const text = markEnglish(s.text);
    let d = state.docs.find((x) => x.sample === key && x.text === text);
    if (!d) d = newDoc({ title: s.label, titleLocked: true, text, font: 'yangtso', sample: key });
    openDoc(d.id);
    showToast(`${s.label} loaded`);
  }
  /* Put a sample in the editor in place of what is there; Ctrl Z brings the old text back. */
  function loadSample(key) {
    const s = SAMPLES[key];
    if (!s) return;
    const text = markEnglish(s.text);
    ta.focus({ preventScroll: true });
    ta.select();
    if (!document.execCommand('insertText', false, text)) {
      ta.value = text;
      ta.dispatchEvent(new Event('input'));
    }
    ta.setSelectionRange(0, 0);
    mirror.scrollTop = 0;
    render(true);
    showToast(`${s.label} loaded · Ctrl Z brings back what was here`);
  }

  /* ---------- prefs ---------- */
  function applyPrefs() {
    const p = state.prefs;
    root.dataset.layout = p.layout;
    root.style.setProperty('--s-size', `${p.size}px`);
    root.style.setProperty('--s-leading', String(p.leading));
    const ed = $('[data-ed]');
    if (ed) ed.dataset.layout = p.layout;
    const size = $('[data-pref-size]');
    if (size) {
      size.value = p.size;
      $('[data-pref-size-out]').textContent = `${p.size} px`;
    }
  }

  function applyDoc() {
    if (!doc) return;
    root.dataset.font = doc.font;
    col.style.fontWeight = String(doc.weight);
    $$('[data-font-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fontBtn === doc.font)));
    $$('[data-weight-btn]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.weightBtn) === doc.weight)));
  }

  /* ---------- rendering ---------- */
  const caretMark = () => {
    const c = document.createElement('span');
    c.className = 'caret';
    c.setAttribute('aria-hidden', 'true');
    return c;
  };

  function scheduleRender() {
    if (renderRaf) return;
    renderRaf = requestAnimationFrame(() => {
      renderRaf = 0;
      render(false);
    });
  }

  function render(force) {
    if (!doc) return;
    const text = ta.value;
    const caret = ta.selectionStart;
    const selA = Math.min(ta.selectionStart, ta.selectionEnd);
    const selB = Math.max(ta.selectionStart, ta.selectionEnd);
    const layout = state.prefs.layout;
    const key = [text.length, caret, selA, selB, layout, focused, state.prefs.hints, state.prefs.coverage, state.prefs.warn].join('|') + text;
    if (!force && key === lastRenderKey) return;
    lastRenderKey = key;

    const lines = tokenize(text);
    const frag = document.createDocumentFragment();
    const outLines = [];
    let badCount = 0;
    let caretEl = null;

    for (const line of lines) {
      const parts = convertLine(line.tokens);
      const ln = document.createElement('div');
      ln.className = 'ln';
      ln.dataset.start = String(line.start);
      ln.dataset.end = String(line.end);
      let bo = ln;
      if (layout === 'inline') {
        bo = document.createElement('div');
        bo.className = 'ln__bo';
        ln.appendChild(bo);
      }
      let placed = false;
      let lineOut = '';
      for (const p of parts) {
        const t = p.token;
        const span = document.createElement('span');
        span.className = `tk tk--${t.type}`;
        span.dataset.s = String(t.start);
        span.dataset.e = String(t.end);
        span.textContent = p.out;
        lineOut += p.out;
        if (selA !== selB && t.end > selA && t.start < selB) span.classList.add('tk--sel');
        const isCur = focused && t.type === 'wy' && caret >= t.start && caret <= t.end;
        if (isCur) {
          span.classList.add('tk--cur');
          if (state.prefs.hints && layout === 'tibetan') span.dataset.wy = t.text;
        }
        if (p.warnings.length && state.prefs.warn && !isCur) {
          span.classList.add('tk--bad');
          span.dataset.warn = `“${t.text}”: ${p.warnings.join(' · ')}`;
          span.tabIndex = 0;
          badCount++;
        }
        if (state.prefs.coverage && t.type !== 'sp' && p.out) {
          const missing = uncovered(p.out);
          if (missing) {
            span.classList.add('tk--nc');
            span.title = `Not in ${FONTS[doc.font].name} v${BUILD.version}, shown by a fallback font: ${missing}`;
          }
        }
        if (!placed && caret >= t.start && caret <= t.end && t.type !== 'sp') {
          if (caret === t.start) {
            caretEl = caretMark();
            bo.append(caretEl, span);
          } else {
            caretEl = caretMark();
            bo.append(span, caretEl);
          }
          placed = true;
        } else if (!placed && t.type === 'sp' && caret > t.start && caret <= t.end) {
          caretEl = caretMark();
          bo.append(span, caretEl);
          placed = true;
        } else if (!placed && t.type === 'sp' && caret === t.start) {
          caretEl = caretMark();
          bo.append(caretEl, span);
          placed = true;
        } else {
          bo.appendChild(span);
        }
      }
      if (!placed && caret >= line.start && caret <= line.end) {
        caretEl = caretMark();
        bo.appendChild(caretEl);
      }
      if (layout === 'inline') {
        const wy = document.createElement('div');
        wy.className = 'ln__wy';
        wy.dataset.start = String(line.start);
        wy.dataset.end = String(line.end);
        const raw = text.slice(line.start, line.end);
        const c = caret - line.start;
        const inLine = caret >= line.start && caret <= line.end;
        const a = clamp(selA - line.start, 0, raw.length);
        const b = clamp(selB - line.start, 0, raw.length);
        if (selA !== selB && selB > line.start && selA < line.end) {
          wy.append(raw.slice(0, a));
          const sel = document.createElement('span');
          sel.className = 'sel';
          sel.textContent = raw.slice(a, b);
          wy.append(sel, raw.slice(b));
        } else if (inLine) {
          wy.append(raw.slice(0, c), caretMark(), raw.slice(c));
        } else {
          wy.append(raw);
        }
        ln.appendChild(wy);
      }
      outLines.push(lineOut);
      frag.appendChild(ln);
    }

    if (!text) {
      const hint = document.createElement('div');
      hint.className = 'ed__empty';
      hint.innerHTML =
        '<span class="ed__empty-lead">Type Wylie, or paste Tibetan.</span>' +
        'Wylie turns into Tibetan as you type: <code>bkra shis bde legs/</code> gives <span lang="bo">བཀྲ་ཤིས་བདེ་ལེགས།</span> ' +
        '(a space makes a tsheg, <code>/</code> a shad). To paste Tibetan, press <code>Ctrl V</code>, or <code>⌘ V</code> on a Mac.';
      frag.appendChild(hint);
    }

    col.replaceChildren(frag);
    uniCache = outLines.join('\n');

    const s = stats(uniCache);
    if (statEl.syl) statEl.syl.textContent = String(s.syllables);
    if (statEl.shad) statEl.shad.textContent = String(s.shad);
    if (statEl.chars) statEl.chars.textContent = String(s.chars);
    if (statEl.read) statEl.read.textContent = s.syllables === 0 ? '0 min' : s.minutes < 1 ? '< 1 min' : `~${Math.round(s.minutes)} min`;
    if (statEl.bad) statEl.bad.textContent = String(badCount);
    if (statEl.badWrap) statEl.badWrap.hidden = badCount === 0;

    if (focused && caretEl) {
      const r = caretEl.getBoundingClientRect();
      const m = mirror.getBoundingClientRect();
      if (r.top < m.top + 24 || r.bottom > m.bottom - 24) caretEl.scrollIntoView({ block: 'center' });
    }

    if (liveEl) {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => {
        liveEl.textContent = uniCache.slice(0, 4000);
      }, 1500);
    }
  }

  /* ---------- caret mapping from the mirror ---------- */
  function setCaret(pos) {
    pos = clamp(pos, 0, ta.value.length);
    ta.setSelectionRange(pos, pos);
    ta.focus({ preventScroll: true });
    focused = true;
    root.dataset.focus = 'true';
    render(true);
  }
  let measureCtx = null;
  function charWidthOf(el) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    const cs = getComputedStyle(el);
    measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return measureCtx.measureText('M').width || 8;
  }
  mirror.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const target = e.target;
    const wyRow = target.closest('.ln__wy');
    if (wyRow) {
      const start = Number(wyRow.dataset.start);
      const end = Number(wyRow.dataset.end);
      const cw = charWidthOf(wyRow);
      const rect = wyRow.getBoundingClientRect();
      const cs = getComputedStyle(wyRow);
      const lineH = parseFloat(cs.lineHeight) || 24;
      const perLine = Math.max(1, Math.floor(rect.width / cw));
      const row = Math.max(0, Math.floor((e.clientY - rect.top) / lineH));
      const colIdx = Math.max(0, Math.round((e.clientX - rect.left) / cw));
      e.preventDefault();
      setCaret(start + clamp(row * perLine + colIdx, 0, end - start));
      return;
    }
    const tk = target.closest('.tk');
    if (tk) {
      const r = tk.getBoundingClientRect();
      const pos = e.clientX < r.left + r.width / 2 ? Number(tk.dataset.s) : Number(tk.dataset.e);
      e.preventDefault();
      setCaret(pos);
      return;
    }
    const ln = target.closest('.ln');
    e.preventDefault();
    if (ln) setCaret(Number(ln.dataset.end));
    else {
      // below the last line, or in the margins: nearest line by vertical position
      const lines = $$('.ln');
      let best = null;
      for (const l of lines) {
        const r = l.getBoundingClientRect();
        if (e.clientY >= r.top) best = l;
      }
      setCaret(best ? Number(best.dataset.end) : ta.value.length);
    }
  });
  mirror.addEventListener('click', (e) => {
    const bad = e.target.closest('.tk--bad');
    if (bad && state.prefs.layout !== 'split') bad.focus();
  });

  /* ---------- textarea events ---------- */
  ta.addEventListener('input', () => {
    if (doc) doc.updated = Date.now();
    scheduleRender();
    saveSoon();
  });
  ta.addEventListener('focus', () => {
    focused = true;
    root.dataset.focus = 'true';
    scheduleRender();
  });
  ta.addEventListener('blur', () => {
    focused = false;
    root.dataset.focus = 'false';
    scheduleRender();
  });
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === ta) scheduleRender();
  });
  // Pasted Tibetan keeps its English: the English runs go in [brackets] so they are not read as Wylie.
  ta.addEventListener('paste', (e) => {
    const text = e.clipboardData && e.clipboardData.getData('text/plain');
    if (!text) return;
    const marked = markEnglish(text);
    if (marked === text) return;
    e.preventDefault();
    if (!document.execCommand('insertText', false, marked)) {
      ta.setRangeText(marked, ta.selectionStart, ta.selectionEnd, 'end');
      scheduleRender();
      saveSoon();
    }
  });
  ta.addEventListener('keyup', scheduleRender);
  ta.addEventListener('mouseup', scheduleRender);
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      persist();
      showToast('Saved in this browser');
    }
  });
  ta.addEventListener('scroll', () => {
    if (state.prefs.layout !== 'split' || syncing) return;
    syncing = true;
    const max = ta.scrollHeight - ta.clientHeight;
    const ratio = max > 0 ? ta.scrollTop / max : 0;
    mirror.scrollTop = ratio * (mirror.scrollHeight - mirror.clientHeight);
    requestAnimationFrame(() => (syncing = false));
  });
  mirror.addEventListener('scroll', () => {
    if (state.prefs.layout !== 'split' || syncing) return;
    syncing = true;
    const max = mirror.scrollHeight - mirror.clientHeight;
    const ratio = max > 0 ? mirror.scrollTop / max : 0;
    ta.scrollTop = ratio * (ta.scrollHeight - ta.clientHeight);
    requestAnimationFrame(() => (syncing = false));
  });

  /* ---------- controls ---------- */
  $$('[data-sample]').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.sample)));
  $$('[data-font-btn]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!doc) return;
      doc.font = b.dataset.fontBtn;
      applyDoc();
      saveSoon();
      render(true);
    }),
  );
  $$('[data-weight-btn]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!doc) return;
      doc.weight = Number(b.dataset.weightBtn);
      applyDoc();
      saveSoon();
    }),
  );
  const sizeIn = $('[data-pref-size]');
  if (sizeIn)
    sizeIn.addEventListener('input', () => {
      state.prefs.size = Number(sizeIn.value);
      root.style.setProperty('--s-size', `${state.prefs.size}px`);
      $('[data-pref-size-out]').textContent = `${state.prefs.size} px`;
      saveSoon();
    });

  /* ---------- messages ---------- */
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.dataset.show = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.dataset.show = 'false'), 2200);
  }
  if (statEl.badWrap)
    statEl.badWrap.addEventListener('click', () => {
      const first = $('.tk--bad');
      if (first) setCaret(Number(first.dataset.s));
    });

  /* ---------- boot ---------- */
  const q = new URLSearchParams(window.location.search);
  const qFont = q.get('font');
  const qSample = q.get('sample');
  applyPrefs();
  if (qSample && SAMPLES[qSample]) {
    openSample(qSample);
  } else {
    // A plain visit opens the reviewer's own page, not a review passage they loaded earlier.
    const isPassage = (d) => d.sample && SAMPLES[d.sample] && d.text === markEnglish(SAMPLES[d.sample].text);
    const current = state.docs.find((d) => d.id === state.currentId);
    const target = current && !isPassage(current) ? current : state.docs.find((d) => !isPassage(d)) || newDoc();
    openDoc(target.id);
  }
  if (qFont && FONTS[qFont] && doc && doc.font !== qFont) {
    doc.font = qFont;
    applyDoc();
    render(true);
    saveSoon();
  }
  window.addEventListener('beforeunload', persist);
  if (window.matchMedia('(pointer: fine)').matches) ta.focus({ preventScroll: true });
}
