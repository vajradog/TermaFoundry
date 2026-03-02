/* ==========================================================================
   terma.js v0.1.0 — ESM Module
   Tibetan text processing utilities for termaUI.
   Handles line-breaking, justification, and punctuation protection
   that CSS alone cannot solve.

   Usage (bundler / import statement):
     import terma from 'termaui';
     terma.prepareAll();

   Named imports also work:
     import { prepare, prepareAll, normalize, normalizeAll } from 'termaui';
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
export function prepare(el) {
  if (!el) return;
  if (el.dataset.termaPrepared) return;

  walkTextNodes(el, (node) => {
    let text = node.textContent;

    // Step 1: Replace tsheg + shad with non-breaking tsheg + shad
    text = text.replace(
      new RegExp(TSHEG + SHAD, 'g'),
      TSHEG_NONBREAK + SHAD
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

const terma = { prepare, prepareAll, normalize, normalizeAll };

export default terma;
