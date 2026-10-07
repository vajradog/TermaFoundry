# Wylie Typing Tutor (`/typing`)

A pilot page: a complete course in typing Tibetan with Extended Wylie (EWTS). It shares no
layout, styles or scripts with the rest of the site; it only borrows the Wylie converter from
`src/foundry/lib/ewts.js` and the self-hosted Tibetan fonts in `public/fonts/`.

```
src/pages/typing.astro     The page: hero with the spelling demonstration, how Wylie works (the
                           anatomy explorer), the course map, the practice room, personal
                           bests, the reference tables. Static parts are rendered at build
                           time; the reference tables come from the converter itself.
src/typing/
  app.js                   Everything that moves: theme, spelling demo, anatomy explorer, trainer,
                           results, high scores, practice log (localStorage, wylie.*)
  data/lexicon.js          308 everyday words: Wylie, English gloss, THL phonetics
  data/curriculum.js       10 units, 55 lessons, the timed tests, reference data
  lib/anatomy.js           Takes a Wylie syllable apart into prefix / superscript / root /
                           subscript / vowel / suffix / post-suffix, checked against the
                           converter's own output
  lib/drill.js             Builds the practice text for a lesson, a timed test, the weak-key
                           drill, or pasted text (Tibetan is converted to Wylie)
  lib/session.js           The typing engine (no DOM): accuracy-first cursor, WPM, accuracy,
                           per-key statistics, pause/resume, timed tests, stars
  styles/typing.css        The page's own styles (light and dark)
  tests/typing.test.mjs    `npm run test:typing` (also a step in the deploy workflow)
src/spell/
  superscripts.json        The opening lesson: Sonam Tsering's three superscript series, each
                           stack drawn from Jomolhari as two SVG paths (superscript red, the
                           rest ink). Made by scripts/superscripts.py, with his voice cut from
                           his video into public/spell/sonam/<wylie>.mp3
  utsang.json, spell.js    The Ü-Tsang spelling-out as data and as a pure function (not on the
                           page yet; tests/spell.test.mjs, `npm run test:spell`)
```

## How it teaches

- **Your own keyboard.** Wylie uses the ordinary Latin keys, so there is no on-screen keyboard:
  the next letter is underlined in the text and named in the hint line. On phones and tablets,
  tapping the text opens the device keyboard.
- **Accuracy first.** The cursor waits for the right key; a wrong key is counted, shakes the
  syllable and names the right key.
- **WPM is the international standard**: correct keystrokes ÷ 5 per minute. Syllables per
  minute are shown beside it.
- **Stars**: one for finishing, two at 95 % accuracy, three at 97 % and the unit's target speed.
  A mistake reveals the key.
- **Timed tests** (1 minute and 3 minutes of words, 1 minute of sentences) keep the ten best
  results on the device. **Weak keys** builds a drill from the keys the student misses most.
  **Your text** practises any passage pasted in Wylie or Tibetan.
- No accounts, nothing uploaded: progress, scores and statistics live in `localStorage`.

## The superscript lesson

The card at the top of the page is Sonam Tsering's lesson "The Superscript Letters" (མགོ་ཅན་གསུམ) as a
player: one stack at a time with its superscript in red, the whole series beneath, his voice for
each stack, a stack every three seconds as in his video. **Play** runs through all three series;
a stack in the row or ← → says one stack. The ra-mgo row follows his order (rtsa before rma).

`python scripts/superscripts.py --video "<his video>.mp4"` rebuilds it: ffmpeg's silencedetect finds
his 33 utterances (he pauses after each stack) and cuts them; each stack is split at the top of its
root letter's head bar, found by laying the root letter over the stack where they overlap most.

## Content

Every word was checked against the Monlam Tibetan–English dictionary (the one bundled with
TermaType) and every syllable of every lesson converts with no warning (the tests enforce
both). Vocabulary is everyday and secular: no religious or political content.

The pronunciations follow THL Simplified Phonetic Transcription (Lhasa) and should be read by a
native speaker before the page leaves pilot; so should the example sentences in Unit 9.
