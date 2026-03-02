/* ==========================================================================
   terma.js v0.1.0
   Tibetan text processing utilities for termaUI.
   Handles line-breaking, justification, and punctuation protection
   that CSS alone cannot solve. Required for correct Tibetan line breaking.

   Usage (browser script tag — sets window.terma global):
     <script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma.js"></script>
     <script>terma.prepareAll();</script>

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
   * prepare(element)
   *
   * Processes Tibetan text inside the given element:
   *
   * 1. Inserts zero-width spaces after tsheg (་) to give browsers
   *    proper line-break opportunities — the #1 Tibetan rendering fix.
   *    Skips tsheg immediately before shad (་།) to keep them together.
   *
   * 2. Wraps double-shad sequences (། །) with word-joiners so they
   *    never split across lines.
   *
   * 3. Replaces tsheg before shad with non-breaking tsheg (༌)
   *    to prevent the nga-shad break: ང་། → ང༌།
   *
   * Call this after the DOM is ready. Safe to call multiple times —
   * already-processed elements are skipped.
   */
  function prepare(el) {
    if (!el) return;
    if (el.dataset.termaPrepared) return;

    walkTextNodes(el, (node) => {
      let text = node.textContent;

      // Step 1: Replace tsheg + shad with non-breaking tsheg + shad
      // This prevents line break between the tsheg and the shad
      text = text.replace(
        new RegExp(TSHEG + SHAD, 'g'),
        TSHEG_NONBREAK + SHAD
      );

      // Step 2: Protect double-shad from splitting
      // ། །  →  །⁠ ⁠།  (word-joiners around the space)
      text = text.replace(
        new RegExp(SHAD + ' ' + SHAD, 'g'),
        SHAD + WJ + ' ' + WJ + SHAD
      );

      // Step 3: Insert zero-width space after tsheg for line-break opportunities
      // But NOT after non-breaking tsheg (already protected above)
      text = text.replace(
        new RegExp(TSHEG + '(?!' + ZWS + ')', 'g'),
        TSHEG + ZWS
      );

      if (text !== node.textContent) {
        node.textContent = text;
      }
    });

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
   * normalize(element)
   *
   * Applies Unicode NFC normalization to all text nodes inside the element.
   *
   * Why this matters: The same Tibetan glyph can be encoded as different
   * Unicode sequences that look identical but are technically different strings.
   * For example, a composed "OM" character vs. built from individual parts.
   * If your database stores NFC and a user types NFD (or vice versa), searches
   * will silently fail. Normalizing to NFC at render time ensures consistent
   * string comparison.
   *
   * Note: NFC covers most cases but does not reorder characters that were typed
   * in an incorrect logical order (a font/input-method problem). For wrong-order
   * stacks that show dotted circles, fix the source data or input method.
   *
   * Safe to call multiple times — skips already-normalized elements.
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

  return { prepare, prepareAll, normalize, normalizeAll };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = terma;
}
