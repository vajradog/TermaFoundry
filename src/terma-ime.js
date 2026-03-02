/*!
 * terma-ime.js — Tibetan IME for browser inputs
 * Monlam / Keyman-compatible phonetic QWERTY → Tibetan Unicode
 * https://termafoundry.com/termaui · MIT License
 */
(function (global) {
  'use strict';

  // ─── Key → Tibetan Unicode map ───────────────────────────────────────────────
  // Layout: Monlam Bod-yig / Keyman Tibetan Direct Input (phonetic QWERTY)
  const MAP = {
    // ── Base consonants ──────────────────────────────────────────────────────
    'k':  '\u0F40', // ཀ  ka
    '[':  '\u0F41', // ཁ  kha
    'g':  '\u0F42', // ག  ga
    ',':  '\u0F44', // ང  nga
    'c':  '\u0F45', // ཅ  ca
    'x':  '\u0F46', // ཆ  cha
    'j':  '\u0F47', // ཇ  ja
    '.':  '\u0F49', // ཉ  nya
    't':  '\u0F4F', // ཏ  ta
    ']':  '\u0F50', // ཐ  tha
    'd':  '\u0F51', // ད  da
    'n':  '\u0F53', // ན  na
    'p':  '\u0F54', // པ  pa
    'f':  '\u0F55', // ཕ  pha
    'b':  '\u0F56', // བ  ba
    'm':  '\u0F58', // མ  ma
    ';':  '\u0F59', // ཙ  tsa
    ':':  '\u0F5A', // ཚ  tsha
    '\\': '\u0F5B', // ཛ  dza
    'v':  '\u0F5D', // ཝ  wa
    'w':  '\u0F5E', // ཞ  zha
    'z':  '\u0F5F', // ཟ  za
    "'":  '\u0F60', // འ  'a  (a-chen)
    'y':  '\u0F61', // ཡ  ya
    'r':  '\u0F62', // ར  ra
    'l':  '\u0F63', // ལ  la
    'q':  '\u0F64', // ཤ  sha
    's':  '\u0F66', // ས  sa
    'h':  '\u0F67', // ཧ  ha
    'a':  '\u0F68', // ཨ  a  (achen)

    // ── Vowel diacritics ─────────────────────────────────────────────────────
    'i':  '\u0F72', // ི  gigu   (i)
    'u':  '\u0F74', // ུ  zhabo  (u)
    'e':  '\u0F7A', // ེ  drenbu (e)
    'o':  '\u0F7C', // ོ  naro   (o)

    // ── Punctuation ──────────────────────────────────────────────────────────
    ' ':  '\u0F0B', // ་  tsheg          (syllable separator)
    '/':  '\u0F0D', // །  shad           (sentence terminator)
    '-':  '\u0F0C', // ༌  non-breaking tsheg

    // ── Tibetan numerals ─────────────────────────────────────────────────────
    '0':  '\u0F20', // ༠
    '1':  '\u0F21', // ༡
    '2':  '\u0F22', // ༢
    '3':  '\u0F23', // ༣
    '4':  '\u0F24', // ༤
    '5':  '\u0F25', // ༥
    '6':  '\u0F26', // ༦
    '7':  '\u0F27', // ༧
    '8':  '\u0F28', // ༨
    '9':  '\u0F29', // ༩

    // ── Subjoined consonants (Shift key) ─────────────────────────────────────
    // Used to build consonant clusters: e.g.  ག + ྲ = གྲ (gra)
    'K':  '\u0F90', // ྐ  subjoined ka
    'G':  '\u0F92', // ྒ  subjoined ga
    'C':  '\u0F95', // ྕ  subjoined ca
    'X':  '\u0F96', // ྖ  subjoined cha
    'J':  '\u0F97', // ྗ  subjoined ja
    'T':  '\u0F9F', // ྟ  subjoined ta
    'D':  '\u0FA1', // ྡ  subjoined da
    'N':  '\u0FA3', // ྣ  subjoined na
    'P':  '\u0FA4', // ྤ  subjoined pa
    'B':  '\u0FA6', // ྦ  subjoined ba
    'M':  '\u0FA8', // ྨ  subjoined ma
    'V':  '\u0FAD', // ྭ  subjoined wa
    'W':  '\u0FAE', // ྮ  subjoined zha
    'Z':  '\u0FAF', // ྯ  subjoined za
    'Y':  '\u0FB1', // ྱ  subjoined ya
    'R':  '\u0FB2', // ྲ  subjoined ra  (ra-ta)
    'L':  '\u0FB3', // ླ  subjoined la  (la-go)
    'Q':  '\u0FB4', // ྴ  subjoined sha
    'S':  '\u0FB6', // ྶ  subjoined sa
    'H':  '\u0FB7', // ྷ  subjoined ha
    'A':  '\u0FB8', // ྸ  subjoined a
  };

  // Keys that should pass through to the browser unchanged
  const PASSTHROUGH = new Set([
    'Backspace', 'Delete',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', 'PageUp', 'PageDown',
    'Tab', 'Enter', 'Escape',
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
    'CapsLock', 'Shift', 'Control', 'Alt', 'Meta', 'AltGraph',
    'PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'ContextMenu',
  ]);

  // ─── Core insertion helper ───────────────────────────────────────────────────
  function insertText(el, text) {
    const s = el.selectionStart != null ? el.selectionStart : el.value.length;
    const e = el.selectionEnd   != null ? el.selectionEnd   : el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    const pos = s + text.length;
    el.setSelectionRange(pos, pos);
    // Dispatch input event so React/Vue/etc listeners fire
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ─── Keydown handler ────────────────────────────────────────────────────────
  function handler(ev) {
    // Allow system shortcuts (Ctrl/Cmd/Alt combinations)
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    // Allow navigation and function keys
    if (PASSTHROUGH.has(ev.key)) return;
    const mapped = MAP[ev.key];
    if (mapped !== undefined) {
      ev.preventDefault();
      insertText(ev.target, mapped);
    }
  }

  // ─── WeakSet tracks attached elements (no memory leaks) ─────────────────────
  const attached = new WeakSet();

  // ─── Public API ─────────────────────────────────────────────────────────────
  const termaIME = {
    /**
     * Attach Tibetan IME to an <input> or <textarea> element.
     * Typed QWERTY keys are silently mapped to Tibetan Unicode.
     * @param {HTMLElement} el
     */
    attach(el) {
      if (!el || attached.has(el)) return;
      el.addEventListener('keydown', handler);
      attached.add(el);
    },

    /**
     * Detach IME from an element, restoring normal keyboard behaviour.
     * @param {HTMLElement} el
     */
    detach(el) {
      if (!el) return;
      el.removeEventListener('keydown', handler);
      attached.delete(el);
    },

    /**
     * Returns true if IME is currently attached to the element.
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    isAttached(el) {
      return el ? attached.has(el) : false;
    },

    /**
     * The full key→character map.
     * Useful for building keyboard hint UIs.
     * @type {Object.<string, string>}
     */
    keyMap: MAP,
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = termaIME;
  } else {
    global.termaIME = termaIME;
  }

})(typeof globalThis !== 'undefined' ? globalThis : window);
