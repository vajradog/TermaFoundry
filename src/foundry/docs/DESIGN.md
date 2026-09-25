# Design direction for the new Terma Foundry site

The old site is a warm-beige, Inter-set, card-grid tool catalogue. The new site is meant to
look like nothing on it: a Tibetan type foundry's specimen site, sleek and modern, where the
fonts themselves are the first thing on every page and the only colour on an otherwise quiet
page.

## The direction: "The fonts speak first"

**The fonts are the hero.** The home page opens on the two typefaces, not on a headline. The
screen is split in two covers: on the left, a green chalkboard in a wooden frame with
དབྱངས་མཚོ written in chalk (Yangtso Regular through a speckle filter) among chalk doodles; on the
right, a sheet of white paper with པདྨ in sumi ink (Pema Regular through a filter that roughens
the edges, streaks the dry hairs of the brush and bleeds faintly underneath), two ink drops and a
red seal that carries the name. The covers grow when hovered. Under them, one line of Latin
explains what this is.

**The chrome is quiet.** Off-white paper (`#f7f7f4`) or near-black (`#0b0b0d`), hairline
borders, big rounded surfaces (18–40 px radii), one electric cobalt accent (`#2f45ff`) used only
for links, buttons and the caret. A floating glass pill holds the navigation. Latin type is
*Instrument Serif* for headings (sharp, modern, italics for emphasis) and *Manrope* for
everything else; Wylie is always *JetBrains Mono*. Latin never competes with the Tibetan.

**Each font gets its own room, in its Regular weight.**

- *Yangtso, the playroom.* The chalkboard again as the page's hero, then pastel meshes (lemon,
  rose, sky, mint, grape), die-cut sticker letters with thick white outlines, balloon and crayon
  and chalkboard treatments, a worksheet with ruled lines to trace, the alphabet on coloured
  tiles. Motion is bouncy (`cubic-bezier(.34,1.56,.64,1)`); doodles wiggle when the board is
  hovered.
- *Pema, the ink room.* White paper as the page's hero, with the name in sumi ink and the red
  seal: dense black on white, the way brush calligraphy is shown. Then sumi ink, ink on cream
  paper, red ink, a cinnabar seal, a dry-brush filter and a woodblock filter. Motion is slow.
  Everything a calligrapher would want on a cover. No gold, no lacquer.
- *Tibetan needs headroom.* Vowel signs and stacks rise well above a Latin cap height, so every
  large Tibetan specimen is set with a line-height of 1.9–2.1 and padding above it. Anything
  tighter clips the tops of the letters against the edge of its box.
- *Plain words for a non-technical reviewer.* Controls say "Font size", "Line spacing", "Text
  width", "Tibetan only / Wylie + Tibetan / Line by line", "Copy / Download". The font size
  slider is always visible in the Studio's top bar.

**The home page is playful.** A two-font tester renders whatever you type in Yangtso and Pema at
once; twelve letter cards flip from the round pen to the brush on hover or tap ("same bones,
two hands"); a short "why" and a pointer to the Writing Studio follow. No credits on the home
page: the credits belong to the fonts, and appear on the two font pages only.

**The Studio** is an app, not a page: full viewport, its own top bar, five themes (light, dark,
paper, ink, lamp-lit), three layouts, a documents drawer, a status bar. The Tibetan is the only
thing on screen at reading size; everything else is 12–13 px chrome.

## Why these choices

- Instrument Serif + Manrope is a pairing the old site never had, and it reads as a foundry.
- Cobalt is deliberately not a "Tibetan" colour: it keeps the chrome neutral so that the
  chalk, ink, vermilion and pastels belong to the fonts alone.
- Every Tibetan effect is live CSS or an SVG filter on the real webfont: nothing is an image, so
  reviewers see the actual outlines at every size, and the treatments double as documentation of
  what each font can take. (A round monoline face survives outlines and stripes; a brush face
  wants effects that respect its edge.)
- Regular weights everywhere on covers, heroes and specimens: they are the weights to judge.
  Light and Bold appear only in the weight comparisons and in the testers.
- No mantras: the sample texts are the two review passages, the font names, the alphabet, the
  digits, and བཀྲ་ཤིས་བདེ་ལེགས།.
- The site is `noindex` and carries a review ribbon on every page: the fonts are not released.

## Two directions considered and not taken

1. **Night sky and prayer flags.** Deep indigo pages, the five flag colours as section accents,
   stars as a texture. Beautiful for Pema, wrong for a kids' font, and the colours would compete
   with the Yangtso playroom. Kept only as the dark theme's coolness and the cobalt accent.
2. **Latin-headline landing page.** A big serif thesis line above the fonts, the way software
   sites open. Tried first and dropped: on a foundry site the fonts have to come first, and the
   Tibetan carries the page on its own.

## Motion, accessibility, performance

- Reveal-on-scroll (opacity + 22 px rise), ink-in for hero specimens (blur + rise once the
  webfonts arrive), wiggle for the chalk doodles, a 3D flip for the letter cards, a stroke that
  breathes on hover. All of it is disabled under `prefers-reduced-motion`.
- Keyboard: visible focus rings, a skip link, segmented controls as radio groups, popovers on
  buttons with `aria-expanded`, the flip cards as buttons, the Studio's textarea as the single
  accessible input.
- Every Tibetan element carries `lang="bo"` and a line-height of 2 (the fonts' ascent and
  descent add up to 2.8 em).
- The six WOFF2 files weigh 0.39 MB (Yangtso) and 0.65 MB (Pema) per weight; each page preloads
  only the Regular it shows first. Google Fonts serves the Latin faces.
