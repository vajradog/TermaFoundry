/*
  studio.js — the Writing Studio editor.

  A hidden <textarea> holds the source (Wylie and/or Tibetan Unicode) and owns the caret, the
  selection, undo and every native keyboard behaviour. A mirror renders that source as Tibetan,
  token by token, and maps clicks back to caret positions. The three layouts are three ways of
  drawing the same mirror; in the split layout the textarea itself is shown on the left.

  Documents and preferences live in localStorage under STORE_KEY.
*/
import { tokenize, convertLine, toWylie, stats, TIBETAN_RE } from './ewts.js';
import { FONTS, SAMPLES, isCovered } from '../data/fonts.js';

const STORE_KEY = 'foundry.studio.v1';
const WIDTHS = { narrow: '34rem', medium: '44rem', wide: '58rem', full: 'none' };
const DEFAULT_PREFS = {
  layout: 'tibetan',
  theme: '',
  size: 34,
  leading: 2,
  width: 'medium',
  hints: true,
  coverage: true,
  warn: true,
  drawer: true,
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const pad2 = (n) => String(n).padStart(2, '0');
const timeOf = (ms) => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const ago = (ms) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.docs)) {
        return { docs: s.docs, currentId: s.currentId || null, prefs: { ...DEFAULT_PREFS, ...(s.prefs || {}) } };
      }
    }
  } catch (e) {
    /* ignore a broken store */
  }
  return { docs: [], currentId: null, prefs: { ...DEFAULT_PREFS } };
}

function deriveTitle(uni) {
  const first = uni.split('\n').find((l) => l.trim()) || '';
  const syls = first
    .trim()
    .split(/[་༌།༎༔\s]+/)
    .filter(Boolean)
    .slice(0, 4);
  return syls.length ? syls.join('་') : 'Untitled';
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

function wrapForCanvas(text, ctx, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    const chunks = para.split(/(?<=[་༌])|(?<=[།༎]\s)|(?<=\s)/);
    let line = '';
    for (const ch of chunks) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxW) {
        out.push(line.trimEnd());
        line = ch;
      } else {
        line = test;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

export function initStudio(root) {
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));

  const ta = $('[data-ta]');
  const mirror = $('[data-mirror]');
  const col = $('[data-col]');
  const titleInput = $('[data-title]');
  const docsEl = $('[data-docs]');
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
    renderDocs();
    saveSoon();
    mirror.scrollTop = 0;
  }
  function deleteDoc(id) {
    const i = state.docs.findIndex((x) => x.id === id);
    if (i < 0) return;
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    state.docs.splice(i, 1);
    if (doc && doc.id === id) {
      doc = null;
      if (!state.docs.length) newDoc();
      openDoc(state.docs[0].id);
    } else {
      renderDocs();
      saveSoon();
    }
  }
  function openSample(key) {
    const s = SAMPLES[key];
    if (!s) return;
    let d = state.docs.find((x) => x.sample === key && x.text === s.text);
    if (!d) d = newDoc({ title: s.label, titleLocked: true, text: s.text, font: key, sample: key });
    openDoc(d.id);
    showToast(`${s.label} loaded`);
  }
  function renderDocs() {
    if (!docsEl) return;
    docsEl.replaceChildren();
    for (const d of state.docs) {
      const item = document.createElement('div');
      item.className = 'doc';
      item.dataset.id = d.id;
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      if (doc && d.id === doc.id) item.setAttribute('aria-current', 'true');
      const t = document.createElement('div');
      t.className = 'doc__title';
      const title = d.title || 'Untitled';
      t.textContent = title;
      if (TIBETAN_RE.test(title)) t.setAttribute('lang', 'bo');
      const del = document.createElement('button');
      del.className = 'doc__del';
      del.type = 'button';
      del.setAttribute('aria-label', `Delete ${title}`);
      del.dataset.del = d.id;
      del.textContent = '×';
      const meta = document.createElement('div');
      meta.className = 'doc__meta';
      const st = stats(d.text || '');
      meta.textContent = `${FONTS[d.font]?.name || 'Yangtso'} · ${st.syllables} syllables · ${ago(d.updated)}`;
      item.append(t, del, meta);
      docsEl.appendChild(item);
    }
  }

  /* ---------- prefs ---------- */
  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyPrefs() {
    const p = state.prefs;
    root.dataset.layout = p.layout;
    root.dataset.theme = p.theme || systemTheme();
    root.style.setProperty('--s-size', `${p.size}px`);
    root.style.setProperty('--s-leading', String(p.leading));
    root.style.setProperty('--s-col', WIDTHS[p.width] || WIDTHS.medium);
    const small = window.innerWidth < 900;
    root.dataset.drawer = p.drawer && !small ? 'open' : 'closed';
    const ed = $('[data-ed]');
    if (ed) ed.dataset.layout = p.layout;
    $$('[data-layout-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layoutBtn === p.layout)));
    const themeSel = $('[data-theme-sel]');
    if (themeSel) themeSel.value = p.theme || '';
    const size = $('[data-pref-size]');
    if (size) {
      size.value = p.size;
      $('[data-pref-size-out]').textContent = `${p.size} px`;
    }
    const lead = $('[data-pref-leading]');
    if (lead) {
      lead.value = p.leading;
      $('[data-pref-leading-out]').textContent = Number(p.leading).toFixed(2);
    }
    $$('[data-pref-width]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.prefWidth === p.width)));
    $$('[data-pref-toggle]').forEach((c) => {
      c.checked = !!p[c.dataset.prefToggle];
    });
    const drawerBtn = $('[data-drawer-toggle]');
    if (drawerBtn) drawerBtn.setAttribute('aria-expanded', String(root.dataset.drawer === 'open'));
  }
  function setPref(key, value) {
    state.prefs[key] = value;
    applyPrefs();
    saveSoon();
    render(true);
  }

  function applyDoc() {
    if (!doc) return;
    root.dataset.font = doc.font;
    col.style.fontWeight = String(doc.weight);
    $$('[data-font-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fontBtn === doc.font)));
    $$('[data-weight-btn]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.weightBtn) === doc.weight)));
    if (titleInput) {
      titleInput.value = doc.title || '';
      titleInput.setAttribute('lang', TIBETAN_RE.test(doc.title || '') ? 'bo' : 'en');
    }
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
            span.title = `Not in ${FONTS[doc.font].name} v0.1, shown by a fallback font: ${missing}`;
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
        '<strong>Start typing Wylie</strong> and it turns into Tibetan as you type, for example <code>bkra shis bde legs/</code> (a space makes a tsheg, <code>/</code> makes a shad).<br><br><strong>Or paste Tibetan text</strong> straight in: press <code>Ctrl V</code> (or <code>⌘ V</code> on a Mac).<br><br>The <strong>Font size</strong> slider is in the bar above. The two review passages are in the Documents panel on the left.';
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

    if (!doc.titleLocked) {
      const t = deriveTitle(uniCache);
      if (t !== doc.title) {
        doc.title = t;
        if (titleInput) {
          titleInput.value = t;
          titleInput.setAttribute('lang', TIBETAN_RE.test(t) ? 'bo' : 'en');
        }
        renderDocs();
      }
    }

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
  ta.addEventListener('keyup', scheduleRender);
  ta.addEventListener('mouseup', scheduleRender);
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      persist();
      showToast('Saved in this browser');
    }
    if (e.key === 'Escape') closeAll();
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

  /* ---------- title ---------- */
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!doc) return;
      const v = titleInput.value;
      if (v.trim()) {
        doc.title = v;
        doc.titleLocked = true;
      } else {
        doc.titleLocked = false;
        doc.title = deriveTitle(uniCache);
      }
      titleInput.setAttribute('lang', TIBETAN_RE.test(v) ? 'bo' : 'en');
      renderDocs();
      saveSoon();
    });
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ta.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- controls ---------- */
  $$('[data-font-btn]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!doc) return;
      doc.font = b.dataset.fontBtn;
      applyDoc();
      saveSoon();
      render(true);
      renderDocs();
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
  $$('[data-layout-btn]').forEach((b) => b.addEventListener('click', () => setPref('layout', b.dataset.layoutBtn)));
  const themeSel = $('[data-theme-sel]');
  if (themeSel) themeSel.addEventListener('change', () => setPref('theme', themeSel.value));
  const sizeIn = $('[data-pref-size]');
  if (sizeIn)
    sizeIn.addEventListener('input', () => {
      state.prefs.size = Number(sizeIn.value);
      root.style.setProperty('--s-size', `${state.prefs.size}px`);
      $('[data-pref-size-out]').textContent = `${state.prefs.size} px`;
      saveSoon();
    });
  const leadIn = $('[data-pref-leading]');
  if (leadIn)
    leadIn.addEventListener('input', () => {
      state.prefs.leading = Number(leadIn.value);
      root.style.setProperty('--s-leading', String(state.prefs.leading));
      $('[data-pref-leading-out]').textContent = state.prefs.leading.toFixed(2);
      saveSoon();
    });
  $$('[data-pref-width]').forEach((b) => b.addEventListener('click', () => setPref('width', b.dataset.prefWidth)));
  $$('[data-pref-toggle]').forEach((c) => c.addEventListener('change', () => setPref(c.dataset.prefToggle, c.checked)));

  /* drawer */
  const drawerBtn = $('[data-drawer-toggle]');
  if (drawerBtn)
    drawerBtn.addEventListener('click', () => {
      const open = root.dataset.drawer !== 'open';
      root.dataset.drawer = open ? 'open' : 'closed';
      state.prefs.drawer = open;
      drawerBtn.setAttribute('aria-expanded', String(open));
      saveSoon();
    });
  const scrim = $('[data-scrim]');
  if (scrim)
    scrim.addEventListener('click', () => {
      root.dataset.drawer = 'closed';
      state.prefs.drawer = false;
      if (drawerBtn) drawerBtn.setAttribute('aria-expanded', 'false');
    });
  const newBtn = $('[data-new-doc]');
  if (newBtn)
    newBtn.addEventListener('click', () => {
      const d = newDoc({ font: doc ? doc.font : 'yangtso', weight: doc ? doc.weight : 400 });
      openDoc(d.id);
      if (window.innerWidth < 900) root.dataset.drawer = 'closed';
      ta.focus({ preventScroll: true });
    });
  $$('[data-sample]').forEach((b) =>
    b.addEventListener('click', () => {
      openSample(b.dataset.sample);
      if (window.innerWidth < 900) root.dataset.drawer = 'closed';
    }),
  );
  if (docsEl) {
    docsEl.addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        deleteDoc(del.dataset.del);
        return;
      }
      const item = e.target.closest('.doc');
      if (item) {
        openDoc(item.dataset.id);
        if (window.innerWidth < 900) root.dataset.drawer = 'closed';
      }
    });
    docsEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const item = e.target.closest('.doc');
        if (item) {
          e.preventDefault();
          openDoc(item.dataset.id);
        }
      }
    });
  }

  /* popovers & panels */
  function closeAll(except) {
    $$('[data-pop]').forEach((p) => {
      if (p !== except) p.hidden = true;
    });
    $$('[data-pop-btn]').forEach((b) => b.setAttribute('aria-expanded', String(!!(except && b.dataset.popBtn === except.dataset.pop))));
    $$('[data-panel]').forEach((p) => {
      if (p !== except) p.dataset.open = 'false';
    });
  }
  $$('[data-pop-btn]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const pop = $(`[data-pop="${b.dataset.popBtn}"]`);
      if (!pop) return;
      const willOpen = pop.hidden;
      closeAll(willOpen ? pop : null);
      pop.hidden = !willOpen;
      b.setAttribute('aria-expanded', String(willOpen));
    }),
  );
  $$('[data-panel-btn]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = $(`[data-panel="${b.dataset.panelBtn}"]`);
      if (!panel) return;
      const willOpen = panel.dataset.open !== 'true';
      closeAll(willOpen ? panel : null);
      panel.dataset.open = String(willOpen);
    }),
  );
  $$('[data-panel-close]').forEach((b) => b.addEventListener('click', () => closeAll()));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-pop]') && !e.target.closest('[data-pop-btn]')) {
      $$('[data-pop]').forEach((p) => (p.hidden = true));
      $$('[data-pop-btn]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  /* ---------- export ---------- */
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.dataset.show = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.dataset.show = 'false'), 2200);
  }
  async function copyText(txt, label) {
    try {
      await navigator.clipboard.writeText(txt);
      showToast(`${label} copied`);
    } catch (e) {
      showToast('Could not copy: your browser refused');
    }
  }
  function download(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function fileBase() {
    return (doc && doc.title ? doc.title : 'terma-studio').replace(/[\\/:*?"<>|\n]+/g, '-').trim().slice(0, 60) || 'terma-studio';
  }
  async function exportPng() {
    const uni = uniCache.trim();
    if (!uni) return showToast('Nothing to export yet');
    const font = FONTS[doc.font];
    const weight = doc.weight;
    const weightName = (font.weights.find((w) => w.css === weight) || font.weights[1]).name;
    try {
      await document.fonts.load(`${weight} 48px '${font.family}'`);
      await document.fonts.load(`600 20px 'Manrope'`);
    } catch (e) {
      /* fall through with whatever is loaded */
    }
    const cs = getComputedStyle(root);
    const bg = cs.getPropertyValue('--s-bg').trim() || '#fff';
    const fg = cs.getPropertyValue('--s-text').trim() || '#000';
    const muted = cs.getPropertyValue('--s-muted').trim() || '#888';
    const W = 1600;
    const pad = 120;
    const fs = 56;
    const leading = Math.max(1.8, state.prefs.leading);
    const lh = fs * leading;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${weight} ${fs}px '${font.family}'`;
    const lines = wrapForCanvas(uni, ctx, W - pad * 2);
    const H = pad * 2 + lines.length * lh + 60;
    const scale = 2;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx.scale(scale, scale);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${weight} ${fs}px '${font.family}'`;
    ctx.fillStyle = fg;
    ctx.textBaseline = 'alphabetic';
    const baseline = (lh - (1.466 + 1.349) * fs) / 2 + 1.466 * fs;
    lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * lh + baseline));
    ctx.font = `600 20px 'Manrope', system-ui, sans-serif`;
    ctx.fillStyle = muted;
    ctx.fillText(`${font.name} ${weightName} · Terma Foundry · review build v0.1 · unreleased`, pad, H - pad + 30);
    canvas.toBlob((blob) => {
      if (!blob) return showToast('Could not render the image');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileBase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast('PNG exported');
    }, 'image/png');
  }
  const actions = {
    'copy-bo': () => copyText(uniCache, 'Tibetan'),
    'copy-wy': () => copyText(toWylie(uniCache).text, 'Wylie'),
    'dl-bo': () => download(`${fileBase()}.txt`, uniCache),
    'dl-wy': () => download(`${fileBase()}-wylie.txt`, toWylie(uniCache).text),
    'dl-both': () => download(`${fileBase()}-both.txt`, `${uniCache}\n\n— Wylie —\n\n${toWylie(uniCache).text}\n`),
    png: exportPng,
    print: () => window.print(),
    'src-wy': () => {
      ta.value = toWylie(uniCache).text;
      ta.setSelectionRange(0, 0);
      render(true);
      saveSoon();
      showToast('Source is now Wylie');
    },
    'src-bo': () => {
      ta.value = uniCache;
      ta.setSelectionRange(0, 0);
      render(true);
      saveSoon();
      showToast('Source is now Tibetan');
    },
  };
  $$('[data-action]').forEach((b) =>
    b.addEventListener('click', () => {
      closeAll();
      const fn = actions[b.dataset.action];
      if (fn) fn();
    }),
  );
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
    if (!state.docs.length) newDoc(qFont && FONTS[qFont] ? { font: qFont } : {});
    const target = state.docs.find((d) => d.id === state.currentId) || state.docs[0];
    openDoc(target.id);
  }
  if (qFont && FONTS[qFont] && doc && doc.font !== qFont) {
    doc.font = qFont;
    applyDoc();
    render(true);
    saveSoon();
  }
  window.addEventListener('beforeunload', persist);
  window.addEventListener('resize', () => {
    if (window.innerWidth < 900 && root.dataset.drawer === 'open' && state.prefs.drawer) root.dataset.drawer = 'closed';
  });
  if (window.matchMedia('(pointer: fine)').matches) ta.focus({ preventScroll: true });
  setInterval(renderDocs, 60000);
}
