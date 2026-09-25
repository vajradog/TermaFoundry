/*
  Font metadata, sample texts and credits for the new Terma Foundry site.
  Every Tibetan string here comes from one of four sources: the two review passages and the
  two font names supplied by the designer, the alphabet / vowels / digits, and the greeting
  བཀྲ་ཤིས་བདེ་ལེགས།. Nothing else was composed, and no mantras are shown anywhere.
*/

export const CREDITS = [
  { role: 'Font Designer', name: 'Thupten Chakrishar', href: 'https://chakrishar.com' },
  { role: 'Calligraphy Advisor', name: 'Jamyang Dorjee Chakrishar', note: 'Tibetan Calligrapher' },
  { role: 'Script Consultant', name: 'Sonam Tsering', note: 'Director, Tibetan Language Program, Columbia University' },
  { role: 'Published by', name: 'Terma Heritage Foundation' },
];

export const TEXT = {
  letters: ['ཀ','ཁ','ག','ང','ཅ','ཆ','ཇ','ཉ','ཏ','ཐ','ད','ན','པ','ཕ','བ','མ','ཙ','ཚ','ཛ','ཝ','ཞ','ཟ','འ','ཡ','ར','ལ','ཤ','ས','ཧ','ཨ'],
  lettersWylie: ['ka','kha','ga','nga','ca','cha','ja','nya','ta','tha','da','na','pa','pha','ba','ma','tsa','tsha','dza','wa','zha','za',"'a",'ya','ra','la','sha','sa','ha','a'],
  alphabet: 'ཀ་ཁ་ག་ང་ཅ་ཆ་ཇ་ཉ་ཏ་ཐ་ད་ན་པ་ཕ་བ་མ་ཙ་ཚ་ཛ་ཝ་ཞ་ཟ་འ་ཡ་ར་ལ་ཤ་ས་ཧ་ཨ།',
  alphabetWylie: "ka kha ga nga ca cha ja nya ta tha da na pa pha ba ma tsa tsha dza wa zha za 'a ya ra la sha sa ha a/",
  kaKhaGaNga: 'ཀ་ཁ་ག་ང',
  vowels: 'ཀ་ཀི་ཀུ་ཀེ་ཀོ།',
  vowelsWylie: 'ka ki ku ke ko/',
  vowelSigns: ['ི', 'ུ', 'ེ', 'ོ'],
  vowelNames: ['gigu · i', 'zhabkyu · u', 'drengbu · e', 'naro · o'],
  digits: '༠༡༢༣༤༥༦༧༨༩',
  digitList: ['༠','༡','༢','༣','༤','༥','༦','༧','༨','༩'],
  tashi: 'བཀྲ་ཤིས་བདེ་ལེགས།',
  tashiWylie: 'bkra shis bde legs/',
  bodyig: 'བོད་ཡིག',
  bodyigWylie: 'bod yig',
};

export const SAMPLES = {
  yangtso: {
    id: 'sample-yangtso',
    label: 'Yangtso review passage',
    note: 'Lhamo and Karma: the opening of a children’s story. Supplied by the designer for review.',
    text: 'ལྷ་མོ་དང་ཀརྨ་གཉིས་ནི་ནིའུ་ཡོག་མངའ་སྡེའི་ཝུའུ་ཌི་སི་ཊོག་ཏུ་གནས་སྡོད་བྱེད་ཀྱི་ཡོད། ཁོ་གཉིས་ནི་སྤྲོ་སྣང་གིས་ཁེངས་པའི་སྤུན་མཆེད་གཉིས་ཡིན་ལ། ནམ་རྒྱུན་ཁོ་གཉིས་ནི་རང་གི་མཐའ་འཁོར་གྱི་འཇིག་རྟེན་ལ་ཤེས་འདོད་ཆེན་པོ་ཡོད་མཁན་ཞིག་ཀྱང་ཡིན། ལོ་དགུ་ལ་སླེབས་པའི་ལྷ་མོ་ནི་སྤུན་ཆེ་བ་དང་འགན་འཁུར་ཡང་ཆེ། རྒྱུན་དུ་ལོ་ལྔ་ལ་སོན་པའི་སྤུན་ཆུང་བ་ཀརྨའི་ལྟ་རྟོག་བྱེད་ཀྱི་ཡོད། ཀརྨའི་འཆར་སྣང་ལ་མཚམས་དང་ཚོད་མེད། ཁོ་གཉིསཀྱི་མི་ཚེའི་ནང་སྤྲོ་སྣང་ལྡན་པའི་འགྱུར་ལྡོག་ཅིག་བྱུང་བ་ནི། པཱ་ལགས་ཀྱིས་ཁོང་ཚོའི་སྤོ་བོ་ལགས་ཀྱི་གསང་བའི་སྒམ་ཆུང་མང་པོ་ནང་ལ་བསྣམས་ཕེབས་པ་དེ་རེད།',
  },
  pema: {
    id: 'sample-pema',
    label: 'Pema review passage',
    note: 'Nine lines of verse. Supplied by the designer for review.',
    text: 'བླ་མ་དང་ལྷག་པའི་ལྷ་ལ་ཕྱག་འཚལ་ལོ། །\nའགྲོ་བ་ཀུན་ལ་བརྩེ་བའི་བདག་ཉིད་ཅན། །\nདམ་ཆོས་བདུད་རྩིའི་ཆར་གྱིས་འགྲོ་བ་རྣམས། །\nམ་ལུས་ཡོངས་སུ་སྨིན་པར་མཛད་པ་པོ། །\nཐུབ་པའི་དབང་པོ་དད་པས་གཙུག་གིས་མཆོད། །\nརྒྱལ་བ་ཀུན་གྱི་བགྲོད་པ་གཅིག་པའི་ལམ། །\nགསུང་རབ་ཀུན་གྱི་སྙིང་པོའི་མཆོག་གྱུར་པ། །\nཤེས་རབ་ཕ་རོལ་ཕྱིན་པའི་དོན་གྱི་ཚུལ། །\nཉམས་སུ་ལེན་པའི་མན་ངག་བཤད་པར་བྱ། །',
  },
};

const sharedCoverage = [
  'The 30 consonants, the vowel signs, the digits, the punctuation and the common symbols of the Tibetan block.',
  'Every consonant stack and every vowel ligature of modern Tibetan: 540 two-, three-, four- and five-letter stacks, plus the positional forms of the subjoined letters. Measured against a corpus of 134 million syllables of modern Tibetan (news, opinion, Wikipedia; 69,880 documents), this set covers 99.75% of what is written.',
  'The glyphs of the common mantras and of the Sanskrit words a Tibetan reader meets outside the pecha: the retroflex letters (ṭa, ṭha, ḍa, ṇa, ṣa), the aspirates, the anusvāra and visarga, the long vowels, and 18 Sanskrit stacks.',
  '847 glyphs in all, of which 555 are precomposed stacks and ligatures; the rest are letters, marks, forms, digits and symbols. Stacks form by OpenType substitution as you type; the vowel signs sit by anchors; side bearings and kerning are set letter by letter.',
];

const sharedLeftOut =
  'The 766 glyphs of the rare Sanskrit set: stacks that occur in transliterated Sanskrit and nowhere in modern Tibetan, the pecha’s apparatus. A text that needs them will show those stacks as their separate letters, one under the other, unstacked.';

const sharedIssues = [
  'ṣa with a ya-btags below (ཥྱ, in the hundred-syllable mantra) sits a little high and lacks the inner curve of the ya’s hook.',
  'nga with a sha-btags (ངྴ) is not right yet.',
];

const sharedNumbers = [
  { n: '847', label: 'glyphs' },
  { n: '555', label: 'precomposed stacks and ligatures' },
  { n: '540', label: 'stacks of modern Tibetan' },
  { n: '99.75%', label: 'of a 134M-syllable corpus covered' },
  { n: '3', label: 'weights: Light, Regular, Bold' },
  { n: '18', label: 'Sanskrit stacks' },
];

export const FONTS = {
  yangtso: {
    id: 'yangtso',
    name: 'Yangtso',
    nameBo: 'དབྱངས་མཚོ',
    nameWylie: 'dbyangs mtsho',
    family: 'Yangtso',
    cssFamily: "'Yangtso', serif",
    kind: 'kids',
    tagline: 'A Tibetan uchen typeface written with one round stroke.',
    short: 'The round-headed, chubby one. Made for children, learners and classrooms.',
    pen: 'One round pen, the same width along every stroke, round ends, no thick and thin.',
    intro: [
      'Yangtso is uchen drawn as a child draws it with a marker: one round pen, the same width along every stroke, round ends, no thick and thin. The letters keep the proportions of a classic uchen hand, every letter’s skeleton drawn by hand by the designer, so the page reads as Tibetan always has, only warmer and simpler.',
      'Yangtso is made for children’s books, primers and readers, classroom material, large print, and screens at reading sizes and above. It is the first face of the family, because a child’s first book is where a font matters most.',
    ],
    uses: ['Children’s books, primers and readers', 'Classroom material and worksheets', 'Large print', 'Screens, at reading sizes and above'],
    weights: [
      { name: 'Light', css: 300, stroke: 65, file: 'yangtso-light.woff2', note: 'for large sizes and airy layouts' },
      { name: 'Regular', css: 400, stroke: 85, file: 'yangtso-regular.woff2', note: 'the weight of a normal book face' },
      { name: 'Bold', css: 700, stroke: 95, file: 'yangtso-bold.woff2', note: 'for headings and for the youngest readers' },
    ],
    weightUnit: 'stroke width, in units of 1000',
    weightNotes: 'Three weights, all one stroke. Regular is the weight of a normal book face; Light for large sizes and airy layouts; Bold for headings and for the youngest readers.',
    coverage: sharedCoverage,
    leftOut: sharedLeftOut,
    numbers: sharedNumbers,
    build: [
      'TrueType outlines, not hinted. Vertical metrics from the tallest and deepest glyphs.',
      'Static fonts only: the three weights differ in outline structure in 231 glyphs and did not merge into a variable font. A weight axis is a later step.',
      'Not yet read as a book page at 12 to 16 px; judged at 40 px and above. A few counters of the densest stacks may close at small sizes in Bold.',
    ],
    knownIssues: sharedIssues,
    notSanskrit:
      'Yangtso is not a Sanskrit-transliteration font: the rare stacks of the pecha’s apparatus are left out on purpose, so that every glyph in the font is one a reader of modern Tibetan actually meets.',
    accent: '#ff6b6b',
  },
  pema: {
    id: 'pema',
    name: 'Pema',
    nameBo: 'པདྨ',
    nameWylie: 'pad+ma',
    family: 'Pema',
    cssFamily: "'Pema', serif",
    kind: 'calligraphic',
    tagline: 'A Tibetan uchen typeface written with a calligraphy brush.',
    short: 'The calligrapher’s one. Heavy heads, light legs, a press at every turn.',
    pen: 'A brush that lands, presses along the head line and at every turn, and lifts fine at the end of a leg.',
    intro: [
      'Pema is uchen as a brush writes it. The brush lands at the start of each stroke, presses full along the head line and at every turn and corner, and lifts fine at the end of a leg, so the thick and the thin of the letters come from the hand’s pressure and not from a cut nib.',
      'The brush follows the traditional stroke order and direction of uchen, letter by letter, which is why the weight falls where a calligrapher’s would: heavy heads, lighter legs, a press where the stroke turns. The letters are the same hand-drawn skeleton as Yangtso. Pema is for titles, covers, headings, prayer cards and dharma texts that want a written voice, at large sizes.',
    ],
    uses: ['Titles and book covers', 'Headings', 'Prayer cards', 'Dharma texts that want a written voice, at large sizes'],
    weights: [
      { name: 'Light', css: 300, stroke: 80, file: 'pema-light.woff2', note: 'the same brush, pressed less' },
      { name: 'Regular', css: 400, stroke: 100, file: 'pema-regular.woff2', note: 'the brush as the hand holds it' },
      { name: 'Bold', css: 700, stroke: 110, file: 'pema-bold.woff2', note: 'the same brush, pressed more' },
    ],
    weightUnit: 'brush width, in units of 1000',
    weightNotes: 'Three weights: Light, Regular and Bold, the same brush pressed less or more.',
    coverage: sharedCoverage,
    leftOut: sharedLeftOut,
    numbers: sharedNumbers,
    build: [
      'TrueType outlines, not hinted. Vertical metrics from the tallest and deepest glyphs.',
      'The brush is a first setting (its pressure along each kind of stroke, the press at turns and corners, the landing and the lift) and is judged by eye in this build; the speed of the hand (the thinning of a fast stroke, the flick at a lift) is not in it yet.',
      'Static fonts only: the three weights differ in outline structure in 440 glyphs and did not merge into a variable font. A weight axis is a later step.',
      'Not yet read as a book page; meant for display sizes.',
    ],
    knownIssues: sharedIssues,
    notSanskrit: 'Pema is not a Sanskrit-transliteration font: the rare stacks of the pecha’s apparatus are left out on purpose.',
    accent: '#d1361b',
  },
};

export const FONT_LIST = [FONTS.yangtso, FONTS.pema];

/* Code points the v0.1 fonts actually contain (both fonts share one character set).
   Text is NFC-normalized before it is checked, so the decomposable precomposed code points
   (U+0F43, U+0F4D, U+0F52 … U+0FB9) never occur; the ones that matter are marks such as
   U+0F84 (halanta), U+0F82, and the rare subjoined letters U+0F9A, U+0F9E, U+0FB5. */
export const COVERAGE = [
  [0x0020, 0x0020], [0x0f00, 0x0f35], [0x0f37, 0x0f42], [0x0f44, 0x0f47], [0x0f49, 0x0f5b],
  [0x0f5d, 0x0f68], [0x0f71, 0x0f72], [0x0f74, 0x0f74], [0x0f7a, 0x0f7c], [0x0f7e, 0x0f80],
  [0x0f83, 0x0f83], [0x0f90, 0x0f92], [0x0f94, 0x0f97], [0x0f99, 0x0f99], [0x0f9b, 0x0f9c],
  [0x0f9f, 0x0fa6], [0x0fa8, 0x0fab], [0x0fad, 0x0fb4], [0x0fb6, 0x0fb8], [0x0fbe, 0x0fcc],
  [0x0fce, 0x0fda],
];

export function isCovered(cp) {
  for (const [a, b] of COVERAGE) if (cp >= a && cp <= b) return true;
  return false;
}

/* @font-face rules, generated so that the base path lives in config.js only. */
export function fontFaceCss(base) {
  return FONT_LIST.flatMap((f) =>
    f.weights.map(
      (w) =>
        `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${w.css};font-display:swap;src:url('${base}/fonts/${w.file}') format('woff2');}`,
    ),
  ).join('\n');
}
