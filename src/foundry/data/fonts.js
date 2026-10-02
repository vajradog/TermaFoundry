/*
  Font metadata, sample texts and credits for the new Terma Foundry site.
  Every Tibetan string here comes from one of four sources: the review passage and the font
  name supplied by the designer, the alphabet / vowels / digits, and the greeting
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
  mixed: {
    id: 'sample-mixed',
    label: 'Mixed language',
    note: 'Tibetan with English names in the middle and happy faces at the end. Supplied by the designer.',
    text: '༄༅། །ཕྱི་ལོ་ ༢༠༢༦ ཟླ་ ༩ ཚེས་ ༣༠ ཉིན་གྱི་ཞོགས་པར་སྤྱི་ནོར་༸གོང་ས་༸སྐྱབས་མགོན་ཆེན་པོ་མཆོག་གིས་རྡ་རམ་ས་ལའི་ཕོ་བྲང་དུ་ཨ་རིའི་གྲོས་ཚོགས་ཀྱི་ཕྱི་འབྲེལ་ལས་དོན་ཚོགས་ཆུང་གི་ཚོགས་གཙོ་སྐུ་ཞབས་བྷི་རི་ཨན་མཱ་སི་ཊི་ (Brian Mast) མཆོག་གིས་དབུ་ཁྲིད་པའི་སྤྱི་མཐུན་ཚོགས་པའི་འཐུས་མི་བྷི་རི་ཨན་མཱ་སི་ཊི་ (Brian Mast) དང་། ཇེམས་གྷལ་ལཱ་གྷར་ (James Gallagher)། ཇི་མི་པཱ་ཊོ་ནི་སི་ (Jimmy Patronis) དང་། མང་གཙོ་ཚོགས་པའི་འཐུས་མི་ཤྲི་ཐཱ་ནེ་ཌར་ (Shri Thanedar) དང་། ཧེ་ལི་སི་ཊིབ་སི་ (Haley Stevens) བཅས་ཨ་རིའི་གྲོས་ཚོགས་ཀྱི་སྐུ་ཚབ་ཚོགས་ཆུང་ཞིག་ལ་མཇལ་འཕྲད་གནང་བ་དང་། དེ་རྗེས་ཐའེ་ཝན་ཚོགས་གཉིས་ཆོས་ཚོགས་ཀྱི་ཚོགས་མི་ ༤༡༢ ལ་མཇལ་ཁ་དང་ལྗགས་ལུང་ཁག་ཅིག་སྩལ་ཡོད་པ་རེད། 😄 ☺ 😄',
  },
};

const coverage = [
  'The 30 consonants, the vowel signs, the digits, the punctuation and the common symbols of the Tibetan block.',
  'Every consonant stack and every vowel ligature of modern Tibetan: 540 two-, three-, four- and five-letter stacks, plus the positional forms of the subjoined letters. Measured against a corpus of 134 million syllables of modern Tibetan (news, opinion, Wikipedia; 69,880 documents), this set covers 99.75% of what is written.',
  'The glyphs of the common mantras and of the Sanskrit words a Tibetan reader meets outside the pecha: the retroflex letters (ṭa, ṭha, ḍa, ṇa, ṣa), the aspirates, the anusvāra and visarga, the long vowels, and 18 Sanskrit stacks.',
  'English, written with the same round pen: A to Z, a to z, 0 to 9 and the punctuation, with curly quotes, dashes, the ellipsis, the bullet and the degree sign. A school print, as children learn it: a one-storey a and g, an l with a tail, round bowls. The capitals and figures stand as tall as the Tibetan head line, so the two scripts sit together on one line. Kerned.',
  'Icons for children’s material on their standard codes (★ ✓ ☺ ♥ ✏ ⚽ ← ↑ → ↓ and more) and the signs of arithmetic, + − × ÷ =. A hyphen typed beside a digit is drawn as a minus (3-1=2, ༣-༡=༢); inside a word it stays a hyphen.',
  '968 glyphs in all, of which 558 are precomposed stacks and ligatures; the rest are letters, marks, forms, digits, English and icons. Stacks form by OpenType substitution as you type; the vowel signs sit by anchors; side bearings and kerning are set letter by letter.',
];

const leftOut = [
  'The 766 glyphs of the rare Sanskrit set: stacks that occur in transliterated Sanskrit and nowhere in modern Tibetan, the pecha’s apparatus. A text that needs them will show those stacks as their separate letters, one under the other, unstacked.',
  'Twenty religious signs of the Tibetan block, left out on purpose for a children’s font: U+0F15–0F18, 0F1E, 0F1F, 0F8A, 0FC2–0FC5, 0FC7–0FCC, 0FCF, 0FD5 and 0FD6. A text that uses them shows them in another font.',
];

const knownIssues = [
  'Seven signs (U+0F04, 0F05, 0F08 and 0F3A–0F3D) are provisional shapes under the pen; the designer’s own drawings of them will replace these.',
  'On the emoji codes (⚽ and the faces) some applications show their own colour emoji instead of Yangtso’s.',
  'Microsoft Word applies the kerning only when “Kerning for fonts” is ticked, and the hyphen-as-minus only with contextual alternates on; elsewhere both are on by default.',
];

const numbers = [
  { n: '968', label: 'glyphs' },
  { n: '558', label: 'precomposed stacks and ligatures' },
  { n: '540', label: 'stacks of modern Tibetan' },
  { n: '99.75%', label: 'of a 134M-syllable corpus covered' },
  { n: '3', label: 'weights: Light, Regular, Bold' },
  { n: 'A–Z', label: 'English letters and figures, same pen' },
];

/* What changed since review build v0.1, the build the first reviewers saw. */
const changes = [
  'English letters, figures and punctuation, written with the same pen and kerned.',
  'Icons for children’s material and the signs of arithmetic.',
  'The pen: the same round pen, its inside corners a little softer.',
  'The skeleton: shorter legs, 8% wider, rounder tummies, a round tsheg; the rings of the zero and the anusvara at the full pen.',
  'Stacks: the wa-zur’s stem sits on the stroke it crosses; the ra-btags hangs from the upright in its line (sra, khra); khra keeps kha’s leg; ha’s leg ends above pha’s opening.',
  'Vowels above: the drengbu and the gigu stand on their syllable where they crowded the tsheg or reached past the letter.',
  'Twenty religious signs left out for a children’s font; U+0F36 added.',
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
    coverage,
    leftOut,
    numbers,
    changes,
    build: [
      'TrueType outlines, not hinted. Vertical metrics from the tallest and deepest glyphs.',
      'Static fonts only: the three weights differ in outline structure and do not merge into a variable font. A weight axis is a later step.',
      'Not yet read as a book page at 12 to 16 px; judged at 40 px and above. A few counters of the densest stacks may close at small sizes in Bold.',
    ],
    knownIssues,
    notSanskrit:
      'Yangtso is not a Sanskrit-transliteration font: the rare stacks of the pecha’s apparatus are left out on purpose, so that every glyph in the font is one a reader of modern Tibetan actually meets.',
    accent: '#ff6b6b',
  },
};

export const FONT_LIST = [FONTS.yangtso];

/* Code points Yangtso 1.0 actually contains (read from its cmap).
   Text is NFC-normalized before it is checked, so the decomposable precomposed code points
   (U+0F43, U+0F4D, U+0F52 … U+0FB9) never occur; the ones that matter are marks such as
   U+0F84 (halanta), U+0F82, and the rare subjoined letters U+0F9A, U+0F9E, U+0FB5. */
export const COVERAGE = [
  [0x0020, 0x007e], [0x00a0, 0x00a0], [0x00b0, 0x00b0], [0x00d7, 0x00d7], [0x00f7, 0x00f7],
  [0x0f00, 0x0f14], [0x0f19, 0x0f1d], [0x0f20, 0x0f42], [0x0f44, 0x0f47], [0x0f49, 0x0f5b],
  [0x0f5d, 0x0f68], [0x0f71, 0x0f72], [0x0f74, 0x0f74], [0x0f7a, 0x0f7c], [0x0f7e, 0x0f80],
  [0x0f83, 0x0f83], [0x0f90, 0x0f92], [0x0f94, 0x0f97], [0x0f99, 0x0f99], [0x0f9b, 0x0f9c],
  [0x0f9f, 0x0fa6], [0x0fa8, 0x0fab], [0x0fad, 0x0fb4], [0x0fb6, 0x0fb8], [0x0fbe, 0x0fc1],
  [0x0fc6, 0x0fc6], [0x0fce, 0x0fce], [0x0fd0, 0x0fd4], [0x0fd7, 0x0fda],
  [0x2010, 0x2011], [0x2013, 0x2014], [0x2018, 0x2019], [0x201c, 0x201d], [0x2022, 0x2022],
  [0x2026, 0x2026], [0x2190, 0x2193], [0x2212, 0x2212], [0x2600, 0x2600], [0x2605, 0x2606],
  [0x2639, 0x263a], [0x2665, 0x2665], [0x266a, 0x266b], [0x26bd, 0x26bd], [0x270f, 0x270f],
  [0x2712, 0x2713], [0x2717, 0x2717], [0x271a, 0x271a], [0x1f310, 0x1f310],
  [0x1f44d, 0x1f44d], [0x1f4d6, 0x1f4d6], [0x1f4f7, 0x1f4f7], [0x1f50d, 0x1f50d], [0x1f604, 0x1f604],
  [0x1f609, 0x1f609], [0x1f62e, 0x1f62e], [0x1f6dd, 0x1f6dd], [0x1f9e9, 0x1f9e9],
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
