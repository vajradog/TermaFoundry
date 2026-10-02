# Needs review by a native reader

Things on the new site that a Tibetan reader should check before the link goes to reviewers.
Nothing here was guessed silently: each item is either left exactly as supplied, or avoided.

## 1. A possible missing tsheg in the Yangtso review passage

(The passage is no longer shown on the site since October 2026; it is kept in the font data
because the converter tests use it.)

The passage supplied for Yangtso contains, in its seventh sentence:

> … ཁོ་གཉིསཀྱི་མི་ཚེའི་ནང་ …

`གཉིསཀྱི` has no tsheg between `གཉིས` and `ཀྱི`. Everywhere else in the passage the same phrase
is written `ཁོ་གཉིས་ནི`, with a tsheg. This looks like a typing slip (`ཁོ་གཉིས་ཀྱི་`), but the
text is shown **exactly as supplied**, on the Yangtso page and in the Studio sample. The
converter still round-trips it (it reads the run as one syllable with a stacked `སྐྱ`), so the
build's tests pass either way.

To fix it, edit `text` under `SAMPLES.yangtso` in `src/foundry/data/fonts.js`.

## 2. Every Tibetan string on the site

All Tibetan text on the site comes from these sources only:

- the font name as supplied, དབྱངས་མཚོ;
- the Studio's mixed-language passage (Tibetan with English names), as supplied but without its
  opening ༄༅། །, with three happy faces added at the end;
- the alphabet (30 consonants), the vowel signs on ཀ (ཀ་ཀི་ཀུ་ཀེ་ཀོ།), and the digits ༠–༩;
- བཀྲ་ཤིས་བདེ་ལེགས།
- བོད་ཡིག (used as the sample word for the weight comparisons, and on the chalkboard on the home page);
- on the home page, the syllable བསྒྲུབས built up in five steps: ག, སྒ, སྒྲ, སྒྲུ, བསྒྲུབས (Wylie
  ga, sga, sgra, sgru, bsgrubs), to show a root letter with a letter on its head, one under its feet,
  a vowel below, a prefix and two suffixes. Please confirm the steps and the captions;
- the whole set on the home page: every stack and sign in the font, read from the font itself,
  each with its Wylie from the converter.

No mantras appear anywhere. The Wylie cheat sheet in the Studio shows single letters and the
syllable ཀ with each vowel; the Sanskrit row shows ཊ ཋ ཌ ཎ ཥ, ཀཾ, ཀཿ and ཀྃ (only to document
the Wylie for those marks); the stacking examples are པདྨ / པད་མ and གཡག / གྱག. Please confirm
these read as intended.

## 3. The reading-time estimate

The Studio estimates reading time at 160 syllables a minute. This is a rough figure for silent
adult reading and is labelled as an estimate. Adjust `minutes` in `src/foundry/lib/ewts.js`
(`stats()`) if you have a better number.

## 4. A Wylie convention the Studio adds

In EWTS a space is a tsheg. The Studio adds one convenience: a space **immediately after a
shad** (`/ `) becomes a real space rather than a tsheg, so `legs/ bde` gives `ལེགས། བདེ` and not
`ལེགས།་བདེ`. Typing `/_` still works. If reviewers prefer strict EWTS, remove the shad rule in
`convertLine()` in `src/foundry/lib/ewts.js`.
