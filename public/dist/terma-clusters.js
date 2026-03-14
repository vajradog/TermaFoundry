/* ==========================================================================
   terma-clusters.js v0.2.0
   Tibetan grapheme clustering utilities for termaUI.

   Prevents dotted-circle artifacts (◌) when Tibetan text is split into
   individual codepoints for per-character DOM rendering — typing tutors,
   diff views, search highlights, animated text, syntax highlighters.

   Root cause: Tibetan vowel signs and subjoined consonants are Unicode
   combining marks. Placed in a DOM element without their base character,
   fonts render them on a dotted-circle placeholder. Grapheme clustering
   groups each base + its combining marks into a single DOM element.

   Usage (browser — sets window.termaClusters global):
     <script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma-clusters.js"></script>
     <script>
       const clusters = termaClusters.tibetanClusters("བོད་");
       // → [
       //     { text: "བོ", cpCount: 2 },  // base + naro vowel
       //     { text: "ད",  cpCount: 1 },  // standalone base
       //     { text: "་",  cpCount: 1 },  // tsheg (not combining)
       //   ]
     </script>

   Usage (bundler — ESM):
     import { isTibetanCombining, tibetanClusters } from 'termaui/dist/terma-clusters.esm.js';
   ========================================================================== */

const termaClusters = (() => {
  'use strict';

  /**
   * isTibetanCombining(code)
   *
   * Returns true if the given Unicode codepoint (integer) is a Tibetan
   * combining mark — a character that must attach to a preceding base
   * character to render correctly.
   *
   * Covered ranges:
   *   U+0F71–U+0F84  vowel signs, virama (ི ུ ེ ོ etc.)
   *   U+0F86–U+0F87  sign marks (྆ ྇)
   *   U+0F90–U+0FBC  subjoined consonants (ྐ ྒ ྲ ྱ ླ ྷ etc.)
   *   U+0F35         ngas bzung nyi zla (༵)
   *   U+0F37         ngas bzung snam bu (༷)
   *   U+0F39         tsa-phru lenition mark (༹)
   *   U+0F7E         anusvara — rje su nga ro (ཾ)
   *   U+0F7F         visarga — rnam bcad (ཿ)
   */
  function isTibetanCombining(code) {
    return (
      (code >= 0x0F71 && code <= 0x0F84) ||
      (code >= 0x0F86 && code <= 0x0F87) ||
      (code >= 0x0F90 && code <= 0x0FBC) ||
      code === 0x0F35 || code === 0x0F37 || code === 0x0F39 ||
      code === 0x0F7E || code === 0x0F7F
    );
  }

  /**
   * tibetanClusters(str)
   *
   * Splits a Tibetan string into grapheme clusters. Each cluster is one
   * base character followed by zero or more combining marks.
   *
   * Returns an array of objects:
   *   text     {string}  — the cluster (one or more codepoints)
   *   cpCount  {number}  — number of Unicode codepoints in this cluster
   *
   * Example:
   *   tibetanClusters("བོད་")
   *   → [
   *       { text: "བོ", cpCount: 2 },   // བ + ོ  (base + naro vowel)
   *       { text: "ད",  cpCount: 1 },   // standalone base
   *       { text: "་",  cpCount: 1 },   // tsheg — not a combining mark
   *     ]
   *
   * Wrap each cluster in a <span class="tr-cluster"> rather than wrapping
   * individual codepoints, to prevent dotted-circle artifacts:
   *
   *   BROKEN:  <span>བ</span><span>ོ</span>  →  བ + ◌ོ
   *   CORRECT: <span class="tr-cluster">བོ</span>  →  བོ
   */
  function tibetanClusters(str) {
    const codepoints = [...str];  // spread handles surrogate pairs correctly
    const clusters = [];
    let currentText = '';
    let currentCount = 0;

    for (const cp of codepoints) {
      const code = cp.codePointAt(0);
      if (isTibetanCombining(code) && currentCount > 0) {
        // Attach combining mark to the current cluster
        currentText += cp;
        currentCount++;
      } else {
        // Flush previous cluster, start a new one
        if (currentCount > 0) {
          clusters.push({ text: currentText, cpCount: currentCount });
        }
        currentText = cp;
        currentCount = 1;
      }
    }

    if (currentCount > 0) {
      clusters.push({ text: currentText, cpCount: currentCount });
    }

    return clusters;
  }

  return { isTibetanCombining, tibetanClusters };
})();

// Expose as window.termaClusters in browser environments
if (typeof window !== 'undefined') {
  window.termaClusters = termaClusters;
}

// Export for module environments (CommonJS / Node)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = termaClusters;
}
