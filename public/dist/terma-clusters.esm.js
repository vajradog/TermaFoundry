/* ==========================================================================
   terma-clusters.esm.js v0.2.0
   ESM build of terma-clusters — named exports for bundlers (Vite, webpack,
   Rollup, esbuild) and native ES module imports.

   Usage:
     import { isTibetanCombining, tibetanClusters } from 'termaui/dist/terma-clusters.esm.js';

     const clusters = tibetanClusters("བོད་");
     // → [{ text: "བོ", cpCount: 2 }, { text: "ད", cpCount: 1 }, { text: "་", cpCount: 1 }]
   ========================================================================== */

/**
 * isTibetanCombining(code)
 *
 * Returns true if the given Unicode codepoint (integer) is a Tibetan
 * combining mark that must attach to a preceding base character.
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
export function isTibetanCombining(code) {
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
 *       { text: "བོ", cpCount: 2 },   // base + naro vowel
 *       { text: "ད",  cpCount: 1 },   // standalone base
 *       { text: "་",  cpCount: 1 },   // tsheg — not combining
 *     ]
 */
export function tibetanClusters(str) {
  const codepoints = [...str];  // spread handles surrogate pairs correctly
  const clusters = [];
  let currentText = '';
  let currentCount = 0;

  for (const cp of codepoints) {
    const code = cp.codePointAt(0);
    if (isTibetanCombining(code) && currentCount > 0) {
      currentText += cp;
      currentCount++;
    } else {
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

export default { isTibetanCombining, tibetanClusters };
