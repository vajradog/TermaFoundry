/* ==========================================================================
   terma.js v0.2.0
   Tibetan text processing utilities for termaUI.
   Handles line-breaking, justification, punctuation protection, and
   grapheme clustering to prevent dotted-circle artifacts.

   Usage (browser script tag — sets window.terma global):
     <script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma.js"></script>
     <script>terma.prepareAll();</script>

   Auto-clustering: if terma-clusters.js is also loaded, terma.prepare()
   automatically wraps combining marks into .tr-cluster spans — no
   extra code required.

   Usage (bundler — import from package):
     See terma.esm.js for ESM named/default exports.
   ========================================================================== */

const terma = (() => {
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

  /**
   * _measureAscentRatio(fontFamily)  [private]
   *
   * Uses Canvas TextMetrics to measure the ascent ratio of a Tibetan font.
   * The ratio is: actualBoundingBoxAscent / fontSize.
   * Results are cached per fontFamily string.
   * Returns a number (typically 0.7–0.9 for Tibetan fonts), or null
   * if TextMetrics is not available (old browsers → CSS fallback only).
   */
  function _measureAscentRatio(fontFamily) {
    if (_ascentCache[fontFamily] !== undefined) return _ascentCache[fontFamily];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = '100px ' + fontFamily;
    var m = ctx.measureText('\u0F42'); // ག ga — clear head mark
    if (typeof m.actualBoundingBoxAscent !== 'number') {
      _ascentCache[fontFamily] = null;
      return null;
    }
    var ratio = m.actualBoundingBoxAscent / 100;
    _ascentCache[fontFamily] = ratio;
    return ratio;
  }

  /**
   * _alignHeadMarks(el)  [private]
   *
   * Pixel-perfect Tibetan head-mark alignment for sized spans.
   * Scans for span[class*="tr-text-"] and span[style*="font-size"],
   * measures each font's ascent ratio via Canvas, and sets an exact
   * vertical-align offset so all head marks sit on the same line.
   *
   * Formula: offset = parentRatio × parentSize − spanRatio × spanSize
   *
   * Skips: .tr-mixed (own alignment), .tr-cluster (no size),
   *        Latin-only spans, same-size spans (within 0.5px).
   */
  function _alignHeadMarks(el) {
    if (typeof document === 'undefined') return;

    var ps = getComputedStyle(el);
    var pSize = parseFloat(ps.fontSize);
    var pFont = ps.fontFamily;
    var pRatio = _measureAscentRatio(pFont);
    if (pRatio === null) return; // no TextMetrics support → CSS fallback

    var spans = el.querySelectorAll(
      'span[class*="tr-text-"], span[style*="font-size"]'
    );

    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];

      // Skip .tr-mixed (has its own alignment model)
      if (span.classList.contains('tr-mixed')) continue;
      // Skip .tr-cluster (no size, stays at baseline)
      if (span.classList.contains('tr-cluster')) continue;

      // Latin detection: no Tibetan Unicode → baseline
      if (!TIBETAN_RE.test(span.textContent)) {
        span.classList.add('tt-latin');
        span.style.verticalAlign = 'baseline';
        span.style.lineHeight = '';
        continue;
      }

      span.classList.remove('tt-latin');

      var ss = getComputedStyle(span);
      var sSize = parseFloat(ss.fontSize);

      // Same-size skip: no alignment needed
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
   *
   * Called automatically by prepare() when window.termaClusters is loaded.
   * Skips text nodes with no Tibetan content or no combining marks.
   */
  function _clusterTextNodes(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const text = node.textContent;
      if (!text || !TIBETAN_RE.test(text)) continue;

      const clusters = window.termaClusters.tibetanClusters(text);
      // Skip if nothing to cluster (no combining marks present)
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
   *    terma-clusters.js is loaded) — prevents dotted-circle artifacts
   *    when elements are built from per-codepoint DOM operations.
   *
   * 1. Replaces tsheg before any clause-ending mark with non-breaking tsheg (༌)
   *    to prevent bad breaks. Covers:
   *      - shad (།  U+0F0D) — standard clause marker
   *      - nyis-shad (༎  U+0F0E) — double clause marker
   *      - gter-ma (༔  U+0F14) — terma / treasure-text sign
   *    Example: ང་། → ང༌།  |  ར་༎ → ར༌༎  |  ར་༔ → ར༌༔
   *
   * 2. Wraps double-shad sequences (། །) with word-joiners so they
   *    never split across lines.
   *
   * 3. Inserts zero-width spaces after tsheg (་) to give browsers
   *    proper line-break opportunities — the #1 Tibetan rendering fix.
   *
   * Call this after the DOM is ready. Safe to call multiple times —
   * already-processed elements are skipped.
   */
  function prepare(el) {
    if (!el) return;
    if (el.dataset.termaPrepared) return;

    // Steps 1–3: text-node mutations first — regexes need tsheg and following
    // punctuation in the same text node, which clustering would split apart.
    walkTextNodes(el, (node) => {
      let text = node.textContent;

      // Step 1: Replace tsheg before clause-ending marks with non-breaking tsheg.
      text = text.replace(
        new RegExp(TSHEG + '([' + SHAD + NYIS_SHAD + GTER_MA + '])', 'g'),
        TSHEG_NONBREAK + '$1'
      );

      // Step 2: Protect double-shad from splitting
      text = text.replace(
        new RegExp(SHAD + ' ' + SHAD, 'g'),
        SHAD + WJ + ' ' + WJ + SHAD
      );

      // Step 3: Insert zero-width space after tsheg for line-break opportunities
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

    // Step 5: head-mark alignment — pixel-perfect vertical alignment of
    // differently-sized Tibetan spans using Canvas TextMetrics.
    _alignHeadMarks(el);

    el.dataset.termaPrepared = 'true';
  }

  /**
   * prepareAll(selector?)
   *
   * Convenience: prepare all [lang="bo"] elements on the page,
   * or all elements matching the given selector.
   */
  function prepareAll(selector) {
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
  function prepareEditable(el) {
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
  function prepareAllEditables(selector) {
    const sel = selector || '[contenteditable][lang="bo"]';
    document.querySelectorAll(sel).forEach(prepareEditable);
  }

  /**
   * cluster(element)
   *
   * Explicitly applies grapheme clustering to all Tibetan text nodes
   * inside the element, wrapping each cluster in a .tr-cluster span.
   * Requires terma-clusters.js to be loaded.
   *
   * Note: prepare() calls this automatically — use cluster() only
   * when you need clustering without the full prepare() pipeline.
   */
  function cluster(el) {
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
  function clusterAll(selector) {
    const sel = selector || '[lang="bo"]';
    document.querySelectorAll(sel).forEach(cluster);
  }

  /**
   * normalize(element)
   *
   * Applies Unicode NFC normalization to all text nodes inside the element.
   */
  function normalize(el) {
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
  function normalizeAll(selector) {
    const sel = selector || '[lang="bo"]';
    document.querySelectorAll(sel).forEach(normalize);
  }

  /**
   * alignHeadMarks(element)
   *
   * Applies pixel-perfect Tibetan head-mark alignment to sized spans
   * inside the element. Uses Canvas TextMetrics to compute exact
   * vertical offsets so all head marks (མགོ་ཅན) sit on the same line.
   *
   * Note: prepare() calls this automatically — use alignHeadMarks()
   * only when you need to re-trigger alignment after dynamic font/size
   * changes without re-running the full prepare() pipeline.
   */
  function alignHeadMarks(el) {
    if (!el) return;
    _alignHeadMarks(el);
  }

  /**
   * alignHeadMarksAll(selector?)
   *
   * Convenience: alignHeadMarks on all [lang="bo"] elements,
   * or all elements matching the given selector.
   */
  function alignHeadMarksAll(selector) {
    const sel = selector || '[lang="bo"]';
    document.querySelectorAll(sel).forEach(alignHeadMarks);
  }

  /**
   * measureAscentRatio(fontFamily)
   *
   * Returns the ascent ratio (head-mark position / font-size) for a
   * given font family, measured via Canvas TextMetrics. Cached.
   * Exposed for advanced users building custom alignment logic.
   */
  function measureAscentRatio(fontFamily) {
    return _measureAscentRatio(fontFamily);
  }

  // Re-align after webfont swap — ascent ratios change from fallback → webfont
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(function () {
      for (var k in _ascentCache) delete _ascentCache[k];
      var aligned = document.querySelectorAll('[data-terma-aligned]');
      for (var i = 0; i < aligned.length; i++) {
        _alignHeadMarks(aligned[i]);
      }
    });
  }

  return {
    prepare, prepareAll, prepareEditable, prepareAllEditables,
    cluster, clusterAll, normalize, normalizeAll,
    alignHeadMarks, alignHeadMarksAll, measureAscentRatio
  };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = terma;
}
