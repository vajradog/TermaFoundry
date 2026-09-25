/* Run: node --test src/foundry/tests/   (also `npm run test:ewts`, and a step in the deploy workflow) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toUnicode, toWylie, analyze, tokenize, convertLine, convertMixed, stats } from '../lib/ewts.js';
import { SAMPLES, TEXT, isCovered } from '../data/fonts.js';

const U = (w) => toUnicode(w).text;

test('every consonant', () => {
  TEXT.lettersWylie.forEach((w, i) => assert.equal(U(w), TEXT.letters[i], w));
  assert.equal(U(TEXT.alphabetWylie), TEXT.alphabet);
});

test('vowels', () => {
  assert.equal(U(TEXT.vowelsWylie), TEXT.vowels);
  assert.equal(U('a A i I u U e ai o au'), 'ཨ་ཨཱ་ཨི་ཨཱི་ཨུ་ཨཱུ་ཨེ་ཨཻ་ཨོ་ཨཽ');
  assert.equal(U('-i'), 'ཨྀ');
});

test('prefixes, superscripts, subscripts, suffixes', () => {
  const cases = {
    'bkra shis bde legs/': 'བཀྲ་ཤིས་བདེ་ལེགས།',
    'sangs rgyas': 'སངས་རྒྱས',
    "'jam dpal dbyangs": 'འཇམ་དཔལ་དབྱངས',
    bsgrubs: 'བསྒྲུབས',
    brgyad: 'བརྒྱད',
    mkhyen: 'མཁྱེན',
    lha: 'ལྷ',
    klu: 'ཀླུ',
    rta: 'རྟ',
    spyi: 'སྤྱི',
    sngags: 'སྔགས',
    gnyis: 'གཉིས',
    dngos: 'དངོས',
    phyag: 'ཕྱག',
    khrims: 'ཁྲིམས',
    rlung: 'རླུང',
    zla: 'ཟླ',
    grwa: 'གྲྭ',
    dbang: 'དབང',
    "'phrul": 'འཕྲུལ',
    rdzogs: 'རྫོགས',
    mdzod: 'མཛོད',
    rnying: 'རྙིང',
    lta: 'ལྟ',
    sna: 'སྣ',
    sla: 'སླ',
    bskyed: 'བསྐྱེད',
    bsgrigs: 'བསྒྲིགས',
    "mnga'": 'མངའ',
    "sde'i": 'སྡེའི',
    "bka'": 'བཀའ',
    dbus: 'དབུས',
    "bcom ldan 'das": 'བཅོམ་ལྡན་འདས',
    'gsang ba': 'གསང་བ',
    bsnams: 'བསྣམས',
  };
  for (const [w, u] of Object.entries(cases)) assert.equal(U(w), u, w);
});

test('known ambiguous cases', () => {
  assert.equal(U('g.yag'), 'གཡག'); // prefix ga + ya
  assert.equal(U('gyag'), 'གྱག'); // ga with ya-btags
  assert.equal(U('g.yang'), 'གཡང');
  assert.equal(U('dgongs'), 'དགོངས');
  assert.equal(U('bya'), 'བྱ');
  assert.equal(U('b.ya'), 'བཡ');
  assert.equal(U("'a"), 'འ');
  assert.equal(U('a'), 'ཨ');
});

test('punctuation, spaces and numerals', () => {
  assert.equal(U('ka/'), 'ཀ།');
  assert.equal(U('ka//'), 'ཀ༎');
  assert.equal(U('ka kha'), 'ཀ་ཁ');
  assert.equal(U('ka_kha'), 'ཀ ཁ');
  assert.equal(U('ka*kha'), 'ཀ༌ཁ');
  assert.equal(U('@#'), '༄༅');
  assert.equal(U('0 1 2 3 4 5 6 7 8 9').replace(/་/g, ''), TEXT.digits);
  assert.equal(U('ka\nkha'), 'ཀ\nཁ');
});

test('Sanskrit stacks and marks (converter coverage; not shown on the site)', () => {
  assert.equal(U('oM ma Ni pad+me hU~M/'), 'ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ།');
  assert.equal(U('oM AH hU~M/'), 'ཨོཾ་ཨཱཿ་ཧཱུྃ།');
  assert.equal(U('badz+ra'), 'བཛྲ');
  assert.equal(U('sid+d+hi'), 'སིདྡྷི');
  assert.equal(U('paN+Di ta'), 'པཎྜི་ཏ');
  assert.equal(U('b+ho Ta'), 'བྷོ་ཊ');
  assert.equal(U('rat+na'), 'རཏྣ');
  assert.equal(U('d+harma'), 'དྷརྨ');
  assert.equal(U('hrIH'), 'ཧྲཱིཿ');
  assert.equal(U('swasti'), 'སྭསྟི');
  assert.equal(U('shrI'), 'ཤྲཱི');
  assert.equal(U('tA ra'), 'ཏཱ་ར');
  assert.equal(U('k+Sha'), 'ཀྵ');
  assert.equal(U('gh'), 'གྷ');
  assert.equal(U('g+ha'), 'གྷ');
  // NFC: the precomposed gha never appears; the font carries the decomposed form
  assert.equal(U('gha'), 'གྷ');
});

test('the two review passages round-trip Unicode -> Wylie -> Unicode exactly', () => {
  for (const s of [SAMPLES.yangtso, SAMPLES.pema]) {
    const nfc = s.text.normalize('NFC');
    assert.equal(nfc, s.text, `${s.id} is already NFC`);
    const { text: wylie, warnings: w1 } = toWylie(nfc);
    assert.deepEqual(w1, [], `${s.id}: toWylie warnings`);
    const { text: back, warnings: w2 } = toUnicode(wylie);
    assert.deepEqual(w2, [], `${s.id}: toUnicode warnings`);
    assert.equal(back, nfc, `${s.id}: round trip`);
  }
});

test('the alphabet, vowels, digits, greeting and font names round-trip', () => {
  for (const t of [TEXT.alphabet, TEXT.vowels, TEXT.tashi, TEXT.digits, TEXT.bodyig, 'དབྱངས་མཚོ', 'པདྨ']) {
    assert.equal(toUnicode(toWylie(t).text).text, t.normalize('NFC'), t);
  }
});

test('invalid Wylie is reported, never blocked', () => {
  const bad = analyze('shs');
  assert.equal(bad.ok, false);
  assert.ok(bad.warnings.length > 0);
  assert.ok(bad.unicode.length > 0, 'still produces a best attempt');
  assert.equal(analyze('bkra').ok, true);
  assert.equal(analyze('bk').ok, false, 'an unfinished syllable warns');
  assert.equal(analyze('bkra/').ok, true);
});

test('mixed Wylie and Unicode input, and the space rule', () => {
  assert.equal(convertMixed('bkra shis/ bde legs/'), 'བཀྲ་ཤིས། བདེ་ལེགས།');
  assert.equal(convertMixed('བཀྲ་ shis'), 'བཀྲ་ཤིས');
  assert.equal(convertMixed('བཀྲ shis'), 'བཀྲ་ཤིས');
  assert.equal(convertMixed('bkra '), 'བཀྲ་');
  assert.equal(convertMixed('  bkra'), 'བཀྲ');
  assert.equal(convertMixed('bkra   shis'), 'བཀྲ་ཤིས');
  assert.equal(convertMixed('bkra shis/\nbde legs/'), 'བཀྲ་ཤིས།\nབདེ་ལེགས།');
  assert.equal(convertMixed(SAMPLES.pema.text), SAMPLES.pema.text);
});

test('tokenizer offsets', () => {
  const lines = tokenize('bkra shis/ བདེ་ལེགས།\nka');
  assert.equal(lines.length, 2);
  const t = lines[0].tokens;
  assert.deepEqual(
    t.map((x) => x.type),
    ['wy', 'sp', 'wy', 'sp', 'bo', 'bo'],
  );
  assert.equal(t[0].text, 'bkra');
  assert.equal(t[0].start, 0);
  assert.equal(t[0].end, 4);
  assert.equal(t[4].text, 'བདེ་');
  assert.equal(t[5].text, 'ལེགས།');
  assert.equal(lines[1].start, 21);
  const parts = convertLine(t);
  assert.equal(parts.map((p) => p.out).join(''), 'བཀྲ་ཤིས། བདེ་ལེགས།');
});

test('statistics', () => {
  const s = stats('བཀྲ་ཤིས་བདེ་ལེགས། ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ།');
  assert.equal(s.syllables, 9);
  assert.equal(s.shad, 2);
  assert.ok(s.minutes > 0);
});

test('coverage table', () => {
  for (const ch of TEXT.alphabet + TEXT.digits + 'དབྱངས་མཚོ' + 'པདྨ' + SAMPLES.yangtso.text + SAMPLES.pema.text) {
    if (/\s/.test(ch)) continue; // line breaks and spaces are not glyphs
    assert.ok(isCovered(ch.codePointAt(0)), `U+${ch.codePointAt(0).toString(16)} should be covered`);
  }
  assert.equal(isCovered(0x0f84), false); // halanta
  assert.equal(isCovered(0x0fb5), false); // subjoined ssa
});
