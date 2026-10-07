/*
  curriculum.js — the course: ten units, fifty-five lessons.

  A lesson:
    id      '4.2'
    title   short title
    keys    the new keys this lesson introduces (shown on the brief and outlined on the keyboard)
    note    the teaching note; `backticks` mark Wylie
    drill   how the practice text is made (see lib/drill.js):
              { kind: 'letters', items, review, count }   syllables, in order once, then mixed
              { kind: 'words', items, count }             lexicon words, shuffled
              { kind: 'sequence', items, count }          in order once, then shuffled
              { kind: 'sentences', items }                [wylie, english] pairs, in order
    target  words per minute for the third star
*/

export const CONSONANTS = [
  ['ka', 'ཀ'], ['kha', 'ཁ'], ['ga', 'ག'], ['nga', 'ང'],
  ['ca', 'ཅ'], ['cha', 'ཆ'], ['ja', 'ཇ'], ['nya', 'ཉ'],
  ['ta', 'ཏ'], ['tha', 'ཐ'], ['da', 'ད'], ['na', 'ན'],
  ['pa', 'པ'], ['pha', 'ཕ'], ['ba', 'བ'], ['ma', 'མ'],
  ['tsa', 'ཙ'], ['tsha', 'ཚ'], ['dza', 'ཛ'], ['wa', 'ཝ'],
  ['zha', 'ཞ'], ['za', 'ཟ'], ["'a", 'འ'], ['ya', 'ཡ'],
  ['ra', 'ར'], ['la', 'ལ'], ['sha', 'ཤ'], ['sa', 'ས'],
  ['ha', 'ཧ'], ['a', 'ཨ'],
];

export const VOWELS = [
  { wy: 'i', sign: 'ི', name: 'gi gu', nameBo: 'གི་གུ', place: 'above' },
  { wy: 'u', sign: 'ུ', name: 'zhabs kyu', nameBo: 'ཞབས་ཀྱུ', place: 'below' },
  { wy: 'e', sign: 'ེ', name: "'greng bu", nameBo: 'འགྲེང་བུ', place: 'above' },
  { wy: 'o', sign: 'ོ', name: 'na ro', nameBo: 'ན་རོ', place: 'above' },
];

/* The parts of a syllable, in writing order, with their Tibetan grammatical names. */
export const POSITIONS = [
  { role: 'prefix', en: 'Prefix', wy: "sngon 'jug", bo: 'སྔོན་འཇུག', letters: "g d b m '" },
  { role: 'super', en: 'Superscript', wy: 'mgo', bo: 'མགོ', letters: 'r l s' },
  { role: 'root', en: 'Root letter', wy: 'ming gzhi', bo: 'མིང་གཞི', letters: 'any of the thirty' },
  { role: 'sub', en: 'Subscript', wy: 'btags', bo: 'བཏགས', letters: 'y r l w' },
  { role: 'vowel', en: 'Vowel', wy: 'dbyangs', bo: 'དབྱངས', letters: 'a i u e o' },
  { role: 'suffix', en: 'Suffix', wy: "rjes 'jug", bo: 'རྗེས་འཇུག', letters: "g ng d n b m ' r l s" },
  { role: 'post', en: 'Post-suffix', wy: "yang 'jug", bo: 'ཡང་འཇུག', letters: 's (d)' },
];

const ALPHA = CONSONANTS.map(([w]) => w);
const row = (i) => ALPHA.slice(i * 4, i * 4 + 4);
const upTo = (i) => ALPHA.slice(0, i * 4);
const ROOTS = ALPHA.filter((w) => w !== 'a').map((w) => w.slice(0, -1)); // k, kh, g ... h
const withVowel = (v) => ROOTS.map((r) => r + v);

export const UNITS = [
  {
    id: 'u1',
    num: 1,
    title: 'The alphabet',
    wy: 'gsal byed',
    bo: 'གསལ་བྱེད།',
    glyph: 'ཀ',
    blurb: 'The thirty consonants, four at a time, in the order every Tibetan child recites them.',
    intro:
      'Tibetan has thirty consonants, learned in rows of four. In Wylie each is typed with its inherent vowel — `ka`, `kha`, `ga`, `nga` — and the space bar types the tsheg (་), the dot that closes every syllable.',
    target: 14,
    lessons: [
      {
        id: '1.1',
        title: 'ka kha ga nga',
        keys: ['k', 'h', 'g', 'n', 'a', ' '],
        note: 'An `h` after a consonant marks aspiration: `k` is ཀ, `kh` is ཁ. The nasal `ng` (ང) is one letter typed with two keys. Press the space bar after every syllable — it types the tsheg.',
        drill: { kind: 'letters', items: row(0), count: 28 },
      },
      {
        id: '1.2',
        title: 'ca cha ja nya',
        keys: ['c', 'j', 'y'],
        note: '`c` is unaspirated, like the ch of “pitch” without a puff of air; `ch` is its aspirated partner. `ny` (ཉ) is a single letter, like the ñ of Spanish.',
        drill: { kind: 'letters', items: row(1), review: upTo(1), count: 28 },
      },
      {
        id: '1.3',
        title: 'ta tha da na',
        keys: ['t', 'd'],
        note: 'The dental row follows the pattern of the first two: plain, aspirated, voiced, nasal.',
        drill: { kind: 'letters', items: row(2), review: upTo(2), count: 28 },
      },
      {
        id: '1.4',
        title: 'pa pha ba ma',
        keys: ['p', 'b', 'm'],
        note: 'The labial row. `ph` is an aspirated p, never an f.',
        drill: { kind: 'letters', items: row(3), review: upTo(3), count: 28 },
      },
      {
        id: '1.5',
        title: 'tsa tsha dza wa',
        keys: ['s', 'z', 'w'],
        note: '`ts`, `tsh` and `dz` are single letters typed with two or three keys: ཙ ཚ ཛ. The order is fixed — t before s, d before z.',
        drill: { kind: 'letters', items: row(4), review: upTo(4), count: 28 },
      },
      {
        id: '1.6',
        title: "zha za 'a ya",
        keys: ["'"],
        note: "The apostrophe types the 'a-chung (འ), a letter in its own right. Do not confuse it with the a-chen (ཨ), the last letter of the alphabet.",
        drill: { kind: 'letters', items: row(5), review: upTo(5), count: 28 },
      },
      {
        id: '1.7',
        title: 'ra la sha sa',
        keys: ['r', 'l'],
        note: '`sh` (ཤ) and `s` (ས) are different letters. So are `zh` (ཞ) and `z` (ཟ).',
        drill: { kind: 'letters', items: row(6), review: upTo(6), count: 28 },
      },
      {
        id: '1.8',
        title: 'ha a',
        keys: [],
        note: 'The last two letters: `ha` (ཧ) and `a` (ཨ). A syllable that begins with a vowel is written in Wylie with the vowel alone; the a-chen ཨ is supplied for you.',
        drill: { kind: 'letters', items: ['ha', 'a'], review: upTo(7), count: 28 },
      },
      {
        id: '1.9',
        title: 'All thirty, in order',
        keys: [],
        note: 'Recite the whole alphabet with your fingers, as it is chanted in class: four letters, a breath, four more.',
        drill: { kind: 'sequence', items: ALPHA, count: 60, ordered: true },
      },
      {
        id: '1.10',
        title: 'All thirty, shuffled',
        keys: [],
        note: 'The same thirty letters in random order. Aim for accuracy first; speed follows.',
        drill: { kind: 'letters', items: ALPHA, count: 45 },
      },
    ],
  },
  {
    id: 'u2',
    num: 2,
    title: 'The vowels',
    wy: 'dbyangs',
    bo: 'དབྱངས།',
    glyph: 'ཨི',
    blurb: 'Four vowel signs above and below the letter, and the inherent a.',
    intro:
      'Every consonant carries an inherent a. Four signs replace it with i, u, e or o. In Wylie the vowel is typed after the consonant, in the order you say it: `k` + `i` = `ki` ཀི.',
    target: 14,
    lessons: [
      {
        id: '2.1',
        title: 'gi gu · i',
        keys: ['i'],
        note: 'gi gu (ི) is written above the letter. Type `i` straight after the consonant: `k` + `i` = `ki` ཀི.',
        drill: { kind: 'letters', items: withVowel('i'), review: ALPHA, count: 30 },
      },
      {
        id: '2.2',
        title: 'zhabs kyu · u',
        keys: ['u'],
        note: 'zhabs kyu (ུ), the “foot hook”, is the only vowel sign written beneath the letter: `ku` ཀུ.',
        drill: { kind: 'letters', items: withVowel('u'), review: withVowel('i'), count: 30 },
      },
      {
        id: '2.3',
        title: "'greng bu · e",
        keys: ['e'],
        note: "'greng bu (ེ) is written above the letter. Compare it with gi gu: ཀི `ki`, ཀེ `ke`.",
        drill: { kind: 'letters', items: withVowel('e'), review: [...withVowel('i'), ...withVowel('u')], count: 30 },
      },
      {
        id: '2.4',
        title: 'na ro · o',
        keys: ['o'],
        note: 'na ro (ོ), the last of the four, is also written above: ཀོ `ko`. Compare ཀེ `ke` and ཀོ `ko`.',
        drill: { kind: 'letters', items: withVowel('o'), review: [...withVowel('i'), ...withVowel('u'), ...withVowel('e')], count: 30 },
      },
      {
        id: '2.5',
        title: 'ka ki ku ke ko',
        keys: [],
        note: 'The vowel series, as it is drilled aloud in class: each letter with a, i, u, e, o.',
        drill: { kind: 'sequence', items: ['k', 'kh', 'g', 'ng', 'c', 'ch', 'j', 'ny'].flatMap((r) => ['a', 'i', 'u', 'e', 'o'].map((v) => r + v)), count: 40, ordered: true },
      },
      {
        id: '2.6',
        title: "a i u e o · 'a 'i 'u 'e 'o",
        keys: [],
        note: "A syllable that begins with a vowel is carried by ཨ: type `i`, `u`, `e` or `o` alone. With an apostrophe in front, the vowel is carried by འ instead: `'o` is འོ.",
        drill: { kind: 'letters', items: ['a', 'i', 'u', 'e', 'o', "'a", "'i", "'u", "'e", "'o"], count: 30 },
      },
    ],
  },
  {
    id: 'u3',
    num: 3,
    title: 'First words',
    wy: "rjes 'jug",
    bo: 'རྗེས་འཇུག',
    glyph: 'མིག',
    blurb: 'Open syllables, then the ten suffixes that close a syllable. Real words from here on.',
    intro:
      'From this unit on, every drill is a real Tibetan word with its meaning and pronunciation. Ten letters can close a syllable — `g ng d n b m \' r l s` — and they are typed after the vowel.',
    target: 16,
    lessons: [
      {
        id: '3.1',
        title: 'Open syllables',
        keys: [],
        note: 'A word of two syllables is typed with a space between them; the space becomes the tsheg, exactly as in the script. Tibetan puts no extra space between words.',
        drill: {
          kind: 'words',
          items: ['kha', 'nga', 'nya', 'bu', 'mi', 'chu', 'me', 'sha', 'sa', 'lo', 'ri', 'so', 'ja', 'kho', 'mo', 'de', 'a ma', 'a pha', 'bu mo', 'nyi ma', 'ri bo', 'lo ma', 'kha ba', 'sha ba', 'pha ma', 'nga tsho', 'tsha po', 'ri mo', 'ka ba', 'a jo', 'a ce', 'nu bo', 'nu mo', 'a khu', 'a ne', 'ra ma', 'ka ra', 'ba', 'wa', 'zho', 'yi ge'],
          count: 20,
        },
      },
      {
        id: '3.2',
        title: 'Suffixes g ng d n',
        keys: [],
        note: 'The suffix follows the vowel: `mi` + `g` = `mig`, eye. In speech a final d or n often changes the vowel — `yod` is pronounced yö — but Wylie spells every letter that is written, so you type what you see.',
        drill: {
          kind: 'words',
          items: ['lag pa', 'mig', 'nang', 'khang pa', 'nad', 'zhing', 'shing', 'chung chung', 'nag po', 'yod', 'yin', 'min', 'ming', 'nyin mo', 'yag po', 'lug', 'me tog', 'kha lag', 'thug pa', 'shing tog', 'mog mog', 'bag leb', 'sang nyin'],
          count: 18,
        },
      },
      {
        id: '3.3',
        title: 'Suffixes b m r l s',
        keys: [],
        note: 'Five more closing letters. The tenth, the apostrophe, closes a syllable only after a prefix — it arrives in Unit 4.',
        drill: {
          kind: 'words',
          items: ['nub', 'shar', 'ser po', 'mar', 'dus', 'lam', 'yul', 'lus po', 'nas', 'zas', 'deb', 'thal ba', 'char pa', 'sor mo', 'kha par', 'red', 'med', 'dom', 'ri bong', 'tshod ma', 'chu tshod', 'tshong pa', 'zhim po', 'kha dog', 'shog bu', 'cog tse', 'tshong khang', 'de ring', 'kha sang', 'nyi shu'],
          count: 18,
        },
      },
      {
        id: '3.4',
        title: 'The post-suffix s',
        keys: [],
        note: "After the suffixes g ng b m a second, silent `s` may follow — the post-suffix (yang 'jug): `lags`, `sems`, `nags`. Type it after the suffix.",
        drill: {
          kind: 'words',
          items: ['sems', 'lags', 'lags so', 'nags tshal', 'zhogs pa', 'mig', 'lam', 'dus', 'khang pa', 'yod', 'kha lag', 'nyin mo', 'me tog', 'zhim po', 'tshong khang', 'char pa'],
          count: 18,
        },
      },
    ],
  },
  {
    id: 'u4',
    num: 4,
    title: 'Prefixes',
    wy: "sngon 'jug",
    bo: 'སྔོན་འཇུག',
    glyph: 'གཅིག',
    blurb: "Five silent letters in front of the root, the 'a-chung in three roles, and the period.",
    intro:
      "Five letters — `g d b m '` — can stand in front of the root letter without being stacked on it. They are typed first, exactly where they are written, and are usually silent.",
    target: 16,
    lessons: [
      {
        id: '4.1',
        title: 'Prefixes g and d',
        keys: [],
        note: '`g` + `c` + `i` + `g` = `gcig`, one — pronounced chik. Wylie keeps every silent letter, so the spelling, not the sound, tells you what to type.',
        drill: {
          kind: 'words',
          items: ['gcig', 'gnyis', 'gsum', 'dgu', 'dkar po', 'dmar po', 'dngul', 'dpe cha', 'gnam', 'gtam', 'gdong', 'dbus', 'gtsang ma', 'gser', 'gsar pa', 'gnas', 'dgun ka'],
          count: 18,
        },
      },
      {
        id: '4.2',
        title: 'Prefixes b and m',
        keys: [],
        note: '`bzhi`, four, is pronounced zhi; `mgo`, head, is go. A prefix can also change the tone of the syllable, but it never changes how you type it.',
        drill: {
          kind: 'words',
          items: ['bzhi', 'bdun', 'bcu', 'bcu gcig', 'bzo', 'bdag po', 'bzang po', 'mgo', 'mthong', 'mdun', 'mtsho', 'mngar mo', 'mkhas pa', 'mjug', 'mtho po', 'mtshan mo'],
          count: 18,
        },
      },
      {
        id: '4.3',
        title: "The 'a-chung, front and back",
        keys: [],
        note: "The apostrophe works in three places: as a prefix (`'dug`), as a root carrying a vowel (`'o ma`, milk), and as a final letter after a prefixed open syllable — `dga'`, `mda'` — where it shows which letter is the root.",
        drill: {
          kind: 'words',
          items: ["'di", "'dug", "'thung", "'dod", "'khor lo", "'o ma", "'od", "'ja'", "'bu", "'jam po", "'dzum", "dga' po", "mda'", "mkha'", "dka' ba", "gza'"],
          count: 18,
        },
      },
      {
        id: '4.4',
        title: 'The period: g.y',
        keys: ['.'],
        note: '`gy` means ga with a ya beneath it (གྱ). To write a prefix ga in front of the letter ya (གཡ), Wylie inserts a period: `g.yag`, yak. The period types nothing; it only marks the boundary.',
        drill: { kind: 'words', items: ['g.yag', 'g.yu', 'g.yas', 'g.yon', 'g.yu mtsho', 'gyon'], count: 16 },
      },
    ],
  },
  {
    id: 'u5',
    num: 5,
    title: 'Superscripts',
    wy: 'mgo',
    bo: 'མགོ',
    glyph: 'རྟ',
    blurb: 'ra-mgo, la-mgo and sa-mgo: the three letters that sit on top.',
    intro:
      'Three letters — `r`, `l` and `s` — can sit on top of another letter. In Wylie the superscript is simply typed first: `r` + `t` + `a` = `rta`, horse (རྟ). The converter builds the stack for you.',
    target: 16,
    lessons: [
      {
        id: '5.1',
        title: 'ra-mgo',
        keys: [],
        note: 'ra on top of k g ng j ny t d n b m ts dz. Over most letters it shrinks to a small hook.',
        drill: {
          kind: 'words',
          items: ['rta', 'rgan po', 'rna ba', 'rdo', 'rtsa ba', 'rkang pa', 'rnying pa', 'rdzong', 'rtse mo', 'rmig pa', 'rtsam pa'],
          count: 18,
        },
      },
      {
        id: '5.2',
        title: 'la-mgo',
        keys: [],
        note: '`la` on top of k g ng c j t d p b h. `lh` (ལྷ) is la over ha, a breathy l: `lho`, south.',
        drill: {
          kind: 'words',
          items: ['lnga', 'lta', 'lde mig', 'lcags', 'lce', 'ljang khu', 'lham', 'lho', 'lpags pa', 'lbu ba', 'ltad mo', 'ldum ra', 'lci po'],
          count: 18,
        },
      },
      {
        id: '5.3',
        title: 'sa-mgo',
        keys: [],
        note: '`sa` on top of k g ng ny t d n p b m ts. It is silent in Lhasa speech: `skad`, language, is ké.',
        drill: {
          kind: 'words',
          items: ['skad', 'sgo', 'sna', 'sman', 'stag', 'snying', 'spu', 'sbal pa', 'sngon po', 'stong', 'sdod', 'snga mo', 'spang', 'skam po', 'sgam', 'skar ma', 'smug po', 'sgo nga', 'sman khang', 'ston ka'],
          count: 18,
        },
      },
      {
        id: '5.4',
        title: 'Review: superscripts',
        keys: [],
        note: 'All three superscripts together, mixed with words from earlier units.',
        drill: {
          kind: 'words',
          items: ['rta', 'rna ba', 'rkang pa', 'rdo', 'lnga', 'lce', 'ljang khu', 'lho', 'skad', 'sgo', 'sna', 'stag', 'snying', 'sngon po', 'skar ma', 'gangs ri', 'rtsam pa', 'bod skad', 'mgo', 'dkar po'],
          count: 20,
        },
      },
    ],
  },
  {
    id: 'u6',
    num: 6,
    title: 'Subscripts',
    wy: 'btags',
    bo: 'བཏགས',
    glyph: 'ཁྱི',
    blurb: 'ya-btags, ra-btags, la-btags and wa-zur: the letters that hang below.',
    intro:
      'Four letters — `y`, `r`, `l` and `w` — can hang beneath another. Type them straight after the letter they hang from: `k` + `y` = `ky` (ཀྱ).',
    target: 16,
    lessons: [
      {
        id: '6.1',
        title: 'ya-btags',
        keys: [],
        note: 'ya-btags (ྱ) hangs under k kh g p ph b m. It changes the sound — `bya` is pronounced ja, `phyi` is chi — which is exactly why you type by spelling.',
        drill: {
          kind: 'words',
          items: ['kyang', 'khyi', 'bya', 'phyi', 'byis pa', 'myur po', 'phyag', 'khyed rang', 'byang', 'byed', 'skyid po', 'byi ba', 'byi la', 'phye ma leb', 'khyim', 'khyim tshang', 'phyugs', 'phyi dro', 'gyon'],
          count: 18,
        },
      },
      {
        id: '6.2',
        title: 'ra-btags',
        keys: [],
        note: 'ra-btags (ྲ) hangs under k kh g t th d p ph b m s h. Under k, t and p it makes a retroflex tr: `sprin`, cloud, is trin.',
        drill: {
          kind: 'words',
          items: ['gru', 'sprin', 'drug', 'phru gu', 'khrag', 'grogs po', 'dri ma', 'dran pa', 'sbrul', 'sgra', 'grang mo', 'skra', "spre'u", 'gro'],
          count: 18,
        },
      },
      {
        id: '6.3',
        title: 'la-btags and wa-zur',
        keys: [],
        note: 'la-btags (ླ) hangs under k g b z r s: `zla ba`, moon, is pronounced dawa. wa-zur (ྭ), a small wedge, is typed `w`: `zhwa mo`, hat; `tshwa`, salt.',
        drill: {
          kind: 'words',
          items: ['zla ba', 'glang', 'rlung', 'slob ma', 'blo', 'glu', 'sla mo', 'gling', 'zlum po', 'glog', 'klad pa', 'slob grwa', 'zhwa mo', 'tshwa', 'rtswa', 'khwa ta'],
          count: 18,
        },
      },
      {
        id: '6.4',
        title: 'Review: subscripts',
        keys: [],
        note: 'All four subscripts, with superscripts and prefixes from earlier units.',
        drill: {
          kind: 'words',
          items: ['khyi', 'bya', 'byi la', 'khyed rang', 'phyi dro', 'sprin', 'drug', 'grogs po', 'sbrul', "spre'u", 'zla ba', 'rlung', 'slob ma', 'slob grwa', 'zhwa mo', 'rtswa', 'skyid po', 'phye ma leb', 'glang'],
          count: 20,
        },
      },
    ],
  },
  {
    id: 'u7',
    num: 7,
    title: 'Full syllables',
    wy: 'ming gzhi',
    bo: 'མིང་གཞི',
    glyph: 'བརྒྱད',
    blurb: 'Prefix, superscript, root, subscript, vowel, suffix, post-suffix — all at once.',
    intro:
      'A Tibetan syllable has up to seven positions. Wylie types them all, left to right and top to bottom: `b·r·g·y·a·d` = `brgyad` བརྒྱད, eight. Seven keys, one syllable.',
    target: 15,
    lessons: [
      {
        id: '7.1',
        title: 'Prefix + superscript',
        keys: [],
        note: 'The prefix comes first, then the stack from the top down: `b` + `r` + `d` + `a` = `brda`, sign.',
        drill: {
          kind: 'words',
          items: ['brda', 'brnyed', 'bsdad', 'bskor', 'brjed', 'bsdus', 'brtan po', 'brtse ba', 'bsam blo', 'bsil po'],
          count: 16,
        },
      },
      {
        id: '7.2',
        title: 'Prefix + subscript',
        keys: [],
        note: 'Prefix, then root, then the letter beneath it: `d` + `p` + `y` + `i` + `d` = `dpyid`, spring — pronounced chi.',
        drill: {
          kind: 'words',
          items: ['dkyil', 'dpyid ka', 'dbyar ka', 'dbyangs', "'bras", "'brug", "'khyags pa", 'bgres po', 'mgyogs po', 'bkra shis', 'mkhyen', 'mgron po', 'bslab', 'mgrin pa'],
          count: 18,
        },
      },
      {
        id: '7.3',
        title: 'The full stack',
        keys: [],
        note: 'Prefix, superscript, root, subscript: `bsgrigs` is b + s + g + r + i + g + s. Type it the way you would spell it aloud.',
        drill: {
          kind: 'words',
          items: ['brgyad', 'brgya', 'bsgrigs', 'bsgrubs', 'brgyab', 'bsgyur', 'bskyod', 'bsgrags', 'bskyar', 'rgya mtsho', 'slob sbyong'],
          count: 18,
        },
      },
      {
        id: '7.4',
        title: "Endings with 'a-chung",
        keys: [],
        note: "After an open syllable the genitive is written with 'a-chung + i: `nga` + `'i` = `nga'i`, my. The 'a-chung can carry u in the same way: `spre'u`, monkey.",
        drill: {
          kind: 'words',
          items: ["nga'i", "mo'i", "bu'i", "de'i", "spre'u", "sge'u khung", 'sems', 'lags', 'dngos', 'dbyangs', 'lcags', "'khyags pa", 'gangs ri'],
          count: 18,
        },
      },
    ],
  },
  {
    id: 'u8',
    num: 8,
    title: 'Vocabulary',
    wy: 'tshig',
    bo: 'ཚིག',
    glyph: 'ཚིག',
    blurb: 'Ten themed word lists: numbers, family, body, nature, animals, food, colours, study, time, the week.',
    intro: 'Every spelling pattern you have learned, in the words a first-year student needs. Each list mixes easy and hard syllables.',
    target: 18,
    lessons: [
      {
        id: '8.1',
        title: 'Numbers',
        keys: [],
        note: 'One to ten, eleven, twenty, a hundred, a thousand. Notice the silent letters: `brgyad`, eight, is gyé.',
        drill: { kind: 'sequence', items: ['gcig', 'gnyis', 'gsum', 'bzhi', 'lnga', 'drug', 'bdun', 'brgyad', 'dgu', 'bcu', 'bcu gcig', 'nyi shu', 'brgya', 'stong'], count: 24 },
      },
      {
        id: '8.2',
        title: 'Family and people',
        keys: [],
        note: 'Kinship terms of everyday Lhasa speech.',
        drill: {
          kind: 'words',
          items: ['a ma', 'a pha', 'pha ma', 'bu', 'bu mo', 'a jo', 'a ce', 'nu bo', 'nu mo', 'a khu', 'a ne', 'khyim tshang', 'byis pa', 'phru gu', 'grogs po', 'mgron po', 'dge rgan', 'slob ma', 'mi', 'rgan po'],
          count: 20,
        },
      },
      {
        id: '8.3',
        title: 'The body',
        keys: [],
        note: 'Head to foot.',
        drill: {
          kind: 'words',
          items: ['mgo', 'mig', 'rna ba', 'sna', 'kha', 'so', 'lce', 'lag pa', 'rkang pa', 'lus po', 'snying', 'skra', 'gdong', 'mgrin pa', 'sor mo', 'dpung pa', 'khrag', 'lpags pa', 'klad pa'],
          count: 20,
        },
      },
      {
        id: '8.4',
        title: 'Nature and weather',
        keys: [],
        note: 'Sky, water and land.',
        drill: {
          kind: 'words',
          items: ['nyi ma', 'zla ba', 'skar ma', 'gnam', 'sprin', 'char pa', 'kha ba', 'rlung', 'ri', 'chu', 'mtsho', 'gtsang po', 'shing', 'me tog', 'sa', 'rdo', 'nags tshal', "'ja'", 'rgya mtsho', 'gangs ri', 'rtswa', 'spang'],
          count: 20,
        },
      },
      {
        id: '8.5',
        title: 'Animals',
        keys: [],
        note: 'From the yak to the butterfly.',
        drill: {
          kind: 'words',
          items: ['rta', 'khyi', 'byi la', 'zhi mi', 'g.yag', "'bri", 'lug', 'ra ma', 'ba', 'bya', 'nya', 'stag', 'dom', "spre'u", 'sbrul', 'glang', 'sbal pa', 'byi ba', 'ri bong', 'wa', 'sha ba', "'bu", 'phye ma leb', 'khwa ta'],
          count: 20,
        },
      },
      {
        id: '8.6',
        title: 'Food and drink',
        keys: [],
        note: 'Tea, tsampa and momos.',
        drill: {
          kind: 'words',
          items: ['ja', "'o ma", 'zho', 'mar', 'sha', "'bras", 'rtsam pa', 'mog mog', 'bag leb', 'thug pa', 'tshod ma', 'shing tog', 'sgo nga', 'kha lag', 'ka ra', 'tshwa', 'gro', 'nas', 'zhim po', 'mngar mo'],
          count: 20,
        },
      },
      {
        id: '8.7',
        title: 'Colours',
        keys: [],
        note: 'Most colour words end in `po`; green is `ljang khu`.',
        drill: { kind: 'words', items: ['dkar po', 'nag po', 'dmar po', 'ser po', 'sngon po', 'ljang khu', 'smug po', 'kha dog'], count: 18 },
      },
      {
        id: '8.8',
        title: 'Home and study',
        keys: [],
        note: 'The words of the classroom and the house.',
        drill: {
          kind: 'words',
          items: ['khang pa', 'sgo', "sge'u khung", 'cog tse', 'dpe cha', 'deb', 'dpe mdzod', 'slob grwa', 'slob grwa chen mo', 'slob ma', 'dge rgan', 'slob sbyong', 'yi ge', 'smyu gu', 'shog bu', 'kha par', 'sman khang', 'tshong khang', 'bod skad', 'bod yig'],
          count: 20,
        },
      },
      {
        id: '8.9',
        title: 'Time and seasons',
        keys: [],
        note: 'Today, tomorrow, and the four seasons.',
        drill: {
          kind: 'words',
          items: ['de ring', 'sang nyin', 'kha sang', 'nyin mo', 'mtshan mo', 'zhogs pa', 'phyi dro', 'dgong dro', 'lo', 'zla ba', 'chu tshod', 'skar ma', 'dus tshod', 'dpyid ka', 'dbyar ka', 'ston ka', 'dgun ka'],
          count: 20,
        },
      },
      {
        id: '8.10',
        title: 'Days of the week',
        keys: [],
        note: "Each day is `gza'`, planet, plus the name of its planet: `gza' zla ba`, Monday, the day of the moon.",
        drill: { kind: 'sequence', items: ["gza' zla ba", "gza' mig dmar", "gza' lhag pa", "gza' phur bu", "gza' pa sangs", "gza' spen pa", "gza' nyi ma"], count: 14, ordered: false },
      },
    ],
  },
  {
    id: 'u9',
    num: 9,
    title: 'Sentences',
    wy: 'tshig grub',
    bo: 'ཚིག་གྲུབ',
    glyph: '།',
    blurb: 'The shad, then greetings, introductions, the classroom and everyday life.',
    intro:
      'The slash `/` types the shad (།), which ends a clause or sentence. After a shad the space is a real space, not a tsheg. After a final nga, Tibetan keeps a tsheg before the shad, so type a space first: `song /`.',
    target: 18,
    lessons: [
      {
        id: '9.1',
        title: 'The shad',
        keys: ['/'],
        note: 'Short sentences, each closed by a shad. Watch the ones ending in nga — `song`, went — they take a space before the slash: `song /` སོང་།',
        drill: {
          kind: 'sentences',
          items: [
            ['nga yin/', 'It is me.'],
            ['de red/', 'That is so.'],
            ['ja yod/', 'There is tea.'],
            ['chu med/', 'There is no water.'],
            ['lags so/', 'Yes. (polite)'],
            ['kho song /', 'He went.'],
            ['khang pa chung chung red/', 'The house is small.'],
            ['nyi ma shar song /', 'The sun has risen.'],
            ['kha ba bab song /', 'It snowed.'],
            ["kha lag zhim po 'dug/", 'The food is delicious.'],
          ],
        },
      },
      {
        id: '9.2',
        title: 'Greetings and courtesy',
        keys: [],
        note: '`bkra shis bde legs` is the everyday greeting. The forms with `sku gzugs` and `mtshan` are honorific — the polite way to speak to a teacher or an elder.',
        drill: {
          kind: 'sentences',
          items: [
            ['bkra shis bde legs/', 'Hello. (literally: good fortune and well-being)'],
            ['khyed rang sku gzugs bde po yin pas/', 'How are you? (polite)'],
            ['lags so/ nga bde po yin/', 'Yes, I am well.'],
            ['thugs rje che/', 'Thank you.'],
            ['dgongs dag/', 'Sorry; excuse me.'],
            ['ga le phebs/', 'Goodbye. (to someone leaving)'],
            ['ga le bzhugs/', 'Goodbye. (to someone staying)'],
            ['yang mjal yong /', 'See you again.'],
          ],
        },
      },
      {
        id: '9.3',
        title: 'Introductions',
        keys: [],
        note: 'The genitive particle changes with the letter before it: `khyed rang gi`, `nga\'i`, `slob grwa chen mo\'i`.',
        drill: {
          kind: 'sentences',
          items: [
            ['khyed rang gi mtshan la ga re zer gyi yod/', 'What is your name? (polite)'],
            ["nga'i ming la bkra shis zer gyi yod/", 'My name is Tashi.'],
            ['khyed rang ga nas yin/', 'Where are you from?'],
            ["nga slob grwa chen mo'i slob ma yin/", 'I am a university student.'],
            ['khyed rang dge rgan yin pas/', 'Are you a teacher?'],
            ['nga bod skad slob sbyong byed kyi yod/', 'I am studying Tibetan.'],
          ],
        },
      },
      {
        id: '9.4',
        title: 'In the classroom',
        keys: [],
        note: '`gsung rogs` — “please say” — is the polite request you will use most in class.',
        drill: {
          kind: 'sentences',
          items: [
            ['khyed rang bod skad shes kyi yod pas/', 'Do you know Tibetan?'],
            ['nga bod skad cung zad shes kyi yod/', 'I know a little Tibetan.'],
            ['yang bskyar gsung rogs/', 'Please say it again.'],
            ['ga le ga le gsung rogs/', 'Please speak slowly.'],
            ["'di bod skad du ga re zer gyi red/", 'What is this called in Tibetan?'],
            ['nga go ma song /', 'I did not understand.'],
            ["dpe cha 'di yag po 'dug/", 'This book is good.'],
          ],
        },
      },
      {
        id: '9.5',
        title: 'Everyday life',
        keys: [],
        note: "`'dug` reports what you see or experience directly: the weather, the taste of food.",
        drill: {
          kind: 'sentences',
          items: [
            ["de ring gnam gshis yag po 'dug/", 'The weather is nice today.'],
            ["nga ja 'thung gi yod/", 'I am drinking tea.'],
            ["kha lag zhim po 'dug/", 'The food is delicious.'],
            ["nga slob grwa la 'gro gi yin/", 'I am going to school.'],
            ['chu tshod ga tshod red/', 'What time is it?'],
            ["de ring gza' ga re red/", 'What day is it today?'],
            ["khyi de chung chung 'dug/", 'That dog is small.'],
          ],
        },
      },
      {
        id: '9.6',
        title: 'A short paragraph',
        keys: [],
        note: 'Everything at once: a student introduces themself. Type it straight through.',
        drill: {
          kind: 'sentences',
          items: [
            ['bkra shis bde legs/', 'Hello.'],
            ["nga'i ming la bkra shis zer gyi yod/", 'My name is Tashi.'],
            ["nga slob grwa chen mo'i slob ma yin/", 'I am a university student.'],
            ['nga bod skad slob sbyong byed kyi yod/', 'I am studying Tibetan.'],
            ['bod yig khag po red/', 'Tibetan script is difficult.'],
            ["yin na'ang nga bod yig la dga' po yod/", 'Even so, I love it.'],
          ],
        },
      },
    ],
  },
  {
    id: 'u10',
    num: 10,
    title: 'Numerals and Sanskrit',
    wy: 'grangs ka',
    bo: 'གྲངས་ཀ',
    glyph: '༡༢',
    blurb: 'Tibetan figures, capital letters for Sanskrit sounds, and stacking with +.',
    intro:
      'The last unit covers what you need for dates, page numbers and loanwords: the Tibetan figures, the capital letters for Sanskrit sounds, and `+` for stacks that Tibetan spelling rules would not build on their own.',
    target: 12,
    lessons: [
      {
        id: '10.1',
        title: 'Tibetan figures',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        note: 'The number keys type the Tibetan figures directly: `2026` is ༢༠༢༦.',
        drill: { kind: 'letters', items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '25', '30', '100', '365', '2026'], count: 28 },
      },
      {
        id: '10.2',
        title: 'Capitals: Sanskrit sounds',
        keys: ['shift'],
        note: 'Hold Shift for the retroflex letters `T Th D N Sh` (ཊ ཋ ཌ ཎ ཥ), the long vowels `A I U` (ཱ ཱི ཱུ), the anusvara `M` (ཾ) and the visarga `H` (ཿ). Lowercase and capital letters are different letters in Wylie.',
        drill: { kind: 'letters', items: ['Ta', 'Tha', 'Da', 'Na', 'Sha', 'kA', 'kI', 'kU', 'aM', 'aH'], count: 24 },
      },
      {
        id: '10.3',
        title: 'Stacking with +',
        keys: ['+'],
        note: 'Sanskrit words stack letters that Tibetan rules never would. A `+` between two letters forces the stack: `pad+ma` is པདྨ (lotus; also the name Pema).',
        drill: {
          kind: 'sentences',
          items: [
            ['pad+ma', 'lotus; the name Pema'],
            ['paN+Di ta', 'paṇḍita, a scholar'],
            ['k+Sha', 'the letter kṣa'],
            ['pad+ma', 'lotus; the name Pema'],
            ['paN+Di ta', 'paṇḍita, a scholar'],
            ['k+Sha', 'the letter kṣa'],
          ],
        },
      },
    ],
  },
];

export const LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));
export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

/* Timed tests: everyday words or sentences from the course. */
export const TESTS = [
  { id: 'w60', label: '1 minute · words', seconds: 60, content: 'words' },
  { id: 'w180', label: '3 minutes · words', seconds: 180, content: 'words' },
  { id: 's60', label: '1 minute · sentences', seconds: 60, content: 'sentences' },
];

/* Every course sentence, for the sentence tests. */
export const SENTENCES = LESSONS.filter((l) => l.drill.kind === 'sentences' && l.unit.num === 9 && l.id !== '9.1').flatMap((l) => l.drill.items);

/* Every lexicon word used in units 3–8, for the word tests and the weak-key drill. */
export const WORD_POOL = [...new Set(LESSONS.filter((l) => l.drill.kind === 'words' || (l.drill.kind === 'sequence' && l.unit.num >= 8)).flatMap((l) => l.drill.items))];

/* Example words for the anatomy explorer. */
export const ANATOMY_EXAMPLES = ['brgyad', 'bsgrigs', 'skad', 'rta', 'mig', 'g.yag', 'dbyangs', "spre'u", "'khyags", 'khyi', 'zla', 'lcags'];

/* The stacks, series by series (the reference table; the opening lesson plays the first three). */
export const STACKS = [
  { name: 'ra-mgo', note: 'ra on top', set: ['rka', 'rga', 'rnga', 'rja', 'rnya', 'rta', 'rda', 'rna', 'rba', 'rma', 'rtsa', 'rdza'] },
  { name: 'la-mgo', note: 'la on top', set: ['lka', 'lga', 'lnga', 'lca', 'lja', 'lta', 'lda', 'lpa', 'lba', 'lha'] },
  { name: 'sa-mgo', note: 'sa on top', set: ['ska', 'sga', 'snga', 'snya', 'sta', 'sda', 'sna', 'spa', 'sba', 'sma', 'stsa'] },
  { name: 'ya-btags', note: 'ya beneath', set: ['kya', 'khya', 'gya', 'pya', 'phya', 'bya', 'mya'] },
  { name: 'ra-btags', note: 'ra beneath', set: ['kra', 'khra', 'gra', 'tra', 'thra', 'dra', 'pra', 'phra', 'bra', 'mra', 'sra', 'hra'] },
  { name: 'la-btags', note: 'la beneath', set: ['kla', 'gla', 'bla', 'zla', 'rla', 'sla'] },
  { name: 'wa-zur', note: 'w beneath', set: ['kwa', 'khwa', 'gwa', 'cwa', 'nywa', 'twa', 'dwa', 'tswa', 'tshwa', 'zhwa', 'zwa', 'rwa', 'shwa', 'hwa', 'grwa', 'phywa'] },
];
