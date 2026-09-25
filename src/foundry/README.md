# The new Terma Foundry site (lives at `/test/`)

This folder, plus `src/pages/test/` and `public/test/`, is the whole of the new site. It shares
nothing with the rest of the repository: no layouts, components, styles, fonts or scripts from
the old site are imported, and no page links to an old URL. When the review is over and the old
site is retired, everything outside these three places can be deleted.

```
src/foundry/
  config.js            BASE path ('/test'), site name, build label. Change BASE here only.
  data/fonts.js        Font metadata, weights, coverage, credits, sample passages, @font-face generator
  layouts/Site.astro   Page shell: head, review ribbon, floating nav, footer with credits
  components/          Filters (SVG text effects), Tryout (type tester), Details, Credits, Wip
  styles/base.css      Tokens, reset, typography, components, motion (self-contained)
  styles/studio.css    The Writing Studio
  lib/ewts.js          The only module that talks to the Wylie converter (+ tokenizer, stats)
  lib/studio.js        The Writing Studio editor
  lib/vendor/          tibetan-ewts-converter 2.0.0 (Apache-2.0), unmodified, with its licence
  tests/ewts.test.mjs  Converter test suite: `npm run test:ewts` (also runs in the deploy workflow)
  docs/DESIGN.md       Aesthetic direction and the alternatives considered
  docs/NEEDS_REVIEW.md Tibetan content a native reader should confirm
src/pages/test/
  index.astro          Home: the chalkboard and paper covers, a two-font tester, flip cards, why, studio
  yangtso.astro        Yangtso: chalkboard hero, not-ready notice, tester, playroom styles, alphabet, reader page, details, credits
  pema.astro           Pema: paper hero, not-ready notice, tester, the brush, ink-room styles, the verse, details, credits
  studio.astro         The Writing Studio (review tool)
public/test/
  fonts/*.woff2        Yangtso and Pema, Light/Regular/Bold, converted from the v0.1 TTF exports
  favicon.svg
```

## Running it

```
npm run dev            # http://localhost:4321/test/
npm run test:ewts      # converter tests
npx astro build        # the site builds into dist/test/…
```

## Moving it to the root of the domain later

1. In `config.js` set `BASE = ''`.
2. Move `src/pages/test/*` to `src/pages/` and `public/test/*` to `public/`.
3. Remove the `noindex` meta tag in `layouts/Site.astro` and the review ribbon when the fonts ship.
4. Delete the old site: everything in `src/` except `src/foundry/` and the moved pages, everything
   in `public/` except the moved files, and the old dependencies in `package.json`
   (Tailwind, MDX, icons, fontsource, navbar). The new site needs only `astro`.

`BASE` is the only place the path is written; the font URLs, links and preloads all derive from it.

## Updating the fonts

Drop new `.ttf` exports in the skeleton repository's `export/` folder, then convert them:

```
python -X utf8 -c "from fontTools.ttLib import TTFont; import glob, os
for f in glob.glob('C:/Users/vajra/Documents/CODE/skeleton/export/*.ttf'):
    t = TTFont(f); t.flavor = 'woff2'; t.save('public/test/fonts/' + os.path.basename(f)[:-4].lower() + '.woff2')"
```

Then update `BUILD` in `config.js` and, if the character set changed, `COVERAGE` in
`data/fonts.js` (the list of code points in the cmap) and the numbers and known issues there.

## The Wylie converter

`lib/vendor/EwtsConverter.mjs` is `tibetan-ewts-converter` 2.0.0 by Roger Espel Llima, the
JavaScript port of `Lingua::BO::Wylie` by its original author (Apache-2.0; see `NOTICE.md`).
`jsewts` (BDRC's port) was evaluated first: it gives the same Tibetan in every case tested but
drops the space after a shad on Unicode → Wylie, so a passage does not round-trip exactly, and
its module wrapper is not ESM-clean.

`lib/ewts.js` wraps it behind `toUnicode`, `toWylie`, `analyze`, `tokenize`, `convertLine`,
`convertMixed` and `stats`. The tests cover every consonant, the vowels, the prefix / superscript
/ subscript / suffix combinations, the known ambiguous cases, punctuation, digits, the Sanskrit
stacks of the common mantras, mixed input, and an exact round-trip of both review passages.
