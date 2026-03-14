/* ==========================================================================
   terma.js v0.2.0 — ESM Module
   Tibetan text processing utilities for termaUI.
   Handles line-breaking, justification, punctuation protection, and
   grapheme clustering to prevent dotted-circle artifacts.

   Usage (bundler / import statement):
     import terma from 'termaui';
     terma.prepareAll();

   Named imports also work:
     import { prepare, prepareAll, cluster, clusterAll, normalize, normalizeAll } from 'termaui';

   Auto-clustering: if window.termaClusters is available (terma-clusters.js
   loaded), prepare() automatically wraps combining marks into .tr-cluster
   spans — no extra code required.
   ========================================================================== */

'use strict';

// Tibetan Unicode constants
const TSHEG = '\u0F0B';             // ་  intersyllabic separator
const TSHEG_NONBREAK = '\u0F0C';    // ༌  non-breaking tsheg
const SHAD = '\u0F0D';              // །  clause/sentence marker
const NYIS_SHAD = '\u0F0E';         // ༎  double shad (single char)
const GTER_MA = '\u0F14';           // ༔  terma sign
const VISARGA = '\u0F7F';           // ཿ  visarga
const ZWS = '\u200B';               // zero-width space (break opportunity)
const WJ = '\u2060';                // word joiner (prevents break)
const TIBETAN_RE = /[\u0F00-\u0FFF]/;

// ── Head-mark alignment (Layer 2) ──────────────────────────
const _ascentCache = {};

function _measureAscentRatio(fontFamily) {
  if (_ascentCache[fontFamily] !== undefined) return _ascentCache[fontFamily];
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  ctx.font = '100px ' + fontFamily;
  var m = ctx.measureText('\u0F42');
  if (typeof m.actualBoundingBoxAscent !== 'number') {
    _ascentCache[fontFamily] = null;
    return null;
  }
  var ratio = m.actualBoundingBoxAscent / 100;
  _ascentCache[fontFamily] = ratio;
  return ratio;
}

function _alignHeadMarks(el) {
  if (typeof document === 'undefined') return;

  var ps = getComputedStyle(el);
  var pSize = parseFloat(ps.fontSize);
  var pRatio = _measureAscentRatio(ps.fontFamily);
  if (pRatio === null) return;

  var spans = el.querySelectorAll(
    'span[class*="tr-text-"], span[style*="font-size"]'
  );

  for (var i = 0; i < spans.length; i++) {
    var span = spans[i];
    if (span.classList.contains('tr-mixed')) continue;
    if (span.classList.contains('tr-cluster')) continue;

    if (!TIBETAN_RE.test(span.textContent)) {
      span.classList.add('tt-latin');
      span.style.verticalAlign = 'baseline';
      span.style.lineHeight = '';
      continue;
    }

    span.classList.remove('tt-latin');

    var ss = getComputedStyle(span);
    var sSize = parseFloat(ss.fontSize);

    if (Math.abs(pSize - sSize) < 0.5) {
      span.style.verticalAlign = '';
      span.style.lineHeight = '';
      continue;
    }

    var sRatio = _measureAscentRatio(ss.fontFamily);
    if (sRatio === null) continue;

    var offset = pRatio * pSize - sRatio * sSize;
    span.style.verticalAlign = offset.toFixed(2) + 'px';
    span.style.lineHeight = '1';
  }

  el.dataset.termaAligned = 'true';
}

/**
 * Walk all text nodes inside an element.
 */
function walkTextNodes(el, callback) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  // Process in reverse to avoid offset issues from mutations
  for (let i = nodes.length - 1; i >= 0; i--) {
    callback(nodes[i]);
  }
}

/**
 * _clusterTextNodes(el)  [private]
 *
 * Walks all text nodes inside el that contain Tibetan text with
 * combining marks and replaces each with a series of
 * <span class="tr-cluster"> elements — one per grapheme cluster.
 */
function _clusterTextNodes(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const text = node.textContent;
    if (!text || !TIBETAN_RE.test(text)) continue;

    const clusters = window.termaClusters.tibetanClusters(text);
    if (!clusters.some(c => c.cpCount > 1)) continue;

    const frag = document.createDocumentFragment();
    for (const c of clusters) {
      const span = document.createElement('span');
      span.className = 'tr-cluster';
      span.textContent = c.text;
      frag.appendChild(span);
    }
    node.parentNode.replaceChild(frag, node);
  }
}

/**
 * prepare(element)
 *
 * Processes Tibetan text inside the given element:
 *
 * 0. Auto-clusters combining marks into .tr-cluster spans (if
 *    window.termaClusters is available) — prevents dotted-circle artifacts.
 *
 * 1. Replaces tsheg before clause-ending marks with non-breaking tsheg (༌).
 *    Covers shad (།), nyis-shad (༎), gter-ma (༔).
 *
 * 2. Wraps double-shad sequences (། །) with word-joiners.
 *
 * 3. Inserts zero-width spaces after tsheg for line-break opportunities.
 *
 * Safe to call multiple times — already-processed elements are skipped.
 */
export function prepare(el) {
  if (!el) return;
  if (el.dataset.termaPrepared) return;

  // Steps 1–3: text-node mutations first — regexes need tsheg and following
  // punctuation in the same text node, which clustering would split apart.
  walkTextNodes(el, (node) => {
    let text = node.textContent;

    text = text.replace(
      new RegExp(TSHEG + '([' + SHAD + NYIS_SHAD + GTER_MA + '])', 'g'),
      TSHEG_NONBREAK + '$1'
    );

    text = text.replace(
      new RegExp(SHAD + ' ' + SHAD, 'g'),
      SHAD + WJ + ' ' + WJ + SHAD
    );

    text = text.replace(
      new RegExp(TSHEG + '(?!' + ZWS + ')', 'g'),
      TSHEG + ZWS
    );

    if (text !== node.textContent) {
      node.textContent = text;
    }
  });

  // Step 4: auto-cluster after text fixes — splitting before would prevent
  // the tsheg→non-breaking-tsheg regex from seeing adjacent characters.
  if (typeof window !== 'undefined' && window.termaClusters) {
    _clusterTextNodes(el);
  }

  // Step 5: head-mark alignment
  _alignHeadMarks(el);

  el.dataset.termaPrepared = 'true';
}

/**
 * prepareAll(selector?)
 *
 * Convenience: prepare all [lang="bo"] elements on the page,
 * or all elements matching the given selector.
 */
export function prepareAll(selector) {
  const sel = selector || '[lang="bo"]';
  document.querySelectorAll(sel).forEach(prepare);
}

/**
 * prepareEditable(element)
 *
 * Prepares a contenteditable element for live Tibetan text entry.
 * Calls prepare() immediately, then re-applies it on every input event
 * so ZWS insertions survive further typing.
 *
 * Use instead of prepare() for <div contenteditable> typing tutors,
 * Tibetan note-taking UIs, or any live-edit Tibetan surface.
 * Pair with [contenteditable][lang="bo"] { white-space: pre-wrap; }
 * (included in termaui.css by default) to prevent ZWS collapse.
 *
 * Safe to call multiple times on the same element — already-attached
 * listeners are skipped.
 */
export function prepareEditable(el) {
  if (!el) return;
  if (el.dataset.termaEditable) return;
  prepare(el);
  let debounce;
  el.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      delete el.dataset.termaPrepared;
      prepare(el);
    }, 150);
  });
  el.dataset.termaEditable = 'true';
}

/**
 * prepareAllEditables(selector?)
 *
 * Convenience: prepareEditable() on all [contenteditable][lang="bo"]
 * elements, or all elements matching the given selector.
 */
export function prepareAllEditables(selector) {
  const sel = selector || '[contenteditable][lang="bo"]';
  document.querySelectorAll(sel).forEach(prepareEditable);
}

/**
 * cluster(element)
 *
 * Explicitly applies grapheme clustering to all Tibetan text nodes
 * inside the element. Requires window.termaClusters to be available.
 *
 * Note: prepare() calls this automatically when terma-clusters.js is loaded.
 */
export function cluster(el) {
  if (!el) return;
  if (typeof window === 'undefined' || !window.termaClusters) return;
  if (el.dataset.termaClustered) return;
  _clusterTextNodes(el);
  el.dataset.termaClustered = 'true';
}

/**
 * clusterAll(selector?)
 *
 * Convenience: cluster all [lang="bo"] elements on the page,
 * or all elements matching the given selector.
 */
export function clusterAll(selector) {
  const sel = selector || '[lang="bo"]';
  document.querySelectorAll(sel).forEach(cluster);
}

/**
 * normalize(element)
 *
 * Applies Unicode NFC normalization to all text nodes inside the element.
 */
export function normalize(el) {
  if (!el) return;
  if (el.dataset.termaNormalized) return;

  walkTextNodes(el, (node) => {
    const normalized = node.textContent.normalize('NFC');
    if (normalized !== node.textContent) {
      node.textContent = normalized;
    }
  });

  el.dataset.termaNormalized = 'true';
}

/**
 * normalizeAll(selector?)
 *
 * Convenience: normalize all [lang="bo"] elements on the page,
 * or all elements matching the given selector.
 */
export function normalizeAll(selector) {
  const sel = selector || '[lang="bo"]';
  document.querySelectorAll(sel).forEach(normalize);
}

/**
 * alignHeadMarks(element)
 *
 * Applies pixel-perfect Tibetan head-mark alignment to sized spans.
 * Note: prepare() calls this automatically.
 */
export function alignHeadMarks(el) {
  if (!el) return;
  _alignHeadMarks(el);
}

/**
 * alignHeadMarksAll(selector?)
 *
 * Convenience: alignHeadMarks on all [lang="bo"] elements.
 */
export function alignHeadMarksAll(selector) {
  const sel = selector || '[lang="bo"]';
  document.querySelectorAll(sel).forEach(alignHeadMarks);
}

/**
 * measureAscentRatio(fontFamily)
 *
 * Returns the ascent ratio for a font family via Canvas TextMetrics.
 */
export function measureAscentRatio(fontFamily) {
  return _measureAscentRatio(fontFamily);
}

// Re-align after webfont swap
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(function () {
    for (var k in _ascentCache) delete _ascentCache[k];
    var aligned = document.querySelectorAll('[data-terma-aligned]');
    for (var i = 0; i < aligned.length; i++) {
      _alignHeadMarks(aligned[i]);
    }
  });
}

const terma = {
  prepare, prepareAll, prepareEditable, prepareAllEditables,
  cluster, clusterAll, normalize, normalizeAll,
  alignHeadMarks, alignHeadMarksAll, measureAscentRatio
};

export default terma;
